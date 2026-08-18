import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { remoteJidToNumber, sendTextMessage } from "@/lib/evolution";
import {
  EVOLUTION_TOOLS,
  createChatCompletion,
  extractTextContent,
} from "@/lib/openai";
import type { ChatMessage } from "@/lib/openai";
import {
  DomainError,
  cancelAppointment,
  checkAvailability,
  createAppointment,
} from "@/lib/domain/scheduling";
import type { Client } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TOOL_ROUNDS = 4;

interface EvolutionPayload {
  event?: string;
  instance?: string;
  data?: {
    key?: { remoteJid?: string; fromMe?: boolean; id?: string };
    pushName?: string;
    message?: Record<string, unknown>;
    messageType?: string;
    data?: {
      key?: { remoteJid?: string; fromMe?: boolean; id?: string };
      message?: Record<string, unknown>;
      pushName?: string;
    };
  };
}

function extractMessage(payload: EvolutionPayload) {
  const data = payload.data ?? {};
  const key = data.key ?? data.data?.key ?? {};
  const message = data.message ?? data.data?.message ?? {};
  const remoteJid = key.remoteJid ?? "";
  const messageId = key.id ?? "";
  const isFromMe = Boolean(key.fromMe);
  const pushName = data.pushName ?? data.data?.pushName;

  let text = "";
  if (typeof message.conversation === "string") {
    text = message.conversation;
  } else if (
    message.extendedTextMessage &&
    typeof (message.extendedTextMessage as { text?: string }).text === "string"
  ) {
    text = (message.extendedTextMessage as { text: string }).text;
  } else if (
    message.imageMessage &&
    typeof (message.imageMessage as { caption?: string }).caption === "string"
  ) {
    text = (message.imageMessage as { caption: string }).caption;
  }

  return { remoteJid, messageId, isFromMe, text, pushName: pushName ?? null };
}

function isValidWebhook(request: NextRequest): boolean {
  const secret = process.env.EVOLUTION_WEBHOOK_SECRET;
  if (!secret) return true; // sem segredo configurado, aceita (não recomendado em produção)
  const header =
    request.headers.get("x-webhook-secret") ?? request.headers.get("apikey");
  return header === secret;
}

async function loadPrompt(clientId: string) {
  const { data, error } = await supabaseAdmin
    .from("attendance_prompts")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getOrCreateConversation(
  clientId: string,
  contactPhone: string,
  contactName: string | null
) {
  const { data: existing, error: findError } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("client_id", clientId)
    .eq("contact_phone", contactPhone)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({
      client_id: clientId,
      contact_phone: contactPhone,
      contact_name: contactName,
      status: "open",
      last_message_at: new Date().toISOString(),
      messages: [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function persistMessage(
  conversationId: string,
  message: unknown,
  status: string
) {
  const { data: current, error: fetchError } = await supabaseAdmin
    .from("conversations")
    .select("messages")
    .eq("id", conversationId)
    .single();
  if (fetchError) throw fetchError;

  const messages = Array.isArray(current?.messages) ? current.messages : [];

  const { error } = await supabaseAdmin
    .from("conversations")
    .update({
      messages: [...messages, message],
      last_message_at: new Date().toISOString(),
      status,
    })
    .eq("id", conversationId);
  if (error) throw error;
}

async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  client: Client
): Promise<string> {
  switch (toolName) {
    case "check_availability": {
      const slots = await checkAvailability(
        client.id,
        String(args.service_name ?? ""),
        String(args.date ?? ""),
        client.timezone
      );
      if (slots.length === 0) {
        return JSON.stringify({
          available: false,
          message: "Nenhum horário disponível nesta data.",
        });
      }
      return JSON.stringify({
        available: true,
        slots: slots.map((s) => ({
          start_time: s.start_time,
          end_time: s.end_time,
          start: s.start,
        })),
      });
    }
    case "create_appointment": {
      const appointment = await createAppointment({
        clientId: client.id,
        serviceName: String(args.service_name ?? ""),
        startsAt: String(args.starts_at ?? ""),
        customerName: String(args.customer_name ?? ""),
        customerPhone: String(args.customer_phone ?? ""),
        timezone: client.timezone,
      });
      return JSON.stringify({
        created: true,
        appointment: {
          id: appointment.id,
          starts_at: appointment.starts_at,
          ends_at: appointment.ends_at,
        },
      });
    }
    case "cancel_appointment": {
      const appointment = await cancelAppointment({
        clientId: client.id,
        serviceName: String(args.service_name ?? ""),
        startsAt: String(args.starts_at ?? ""),
        customerPhone: String(args.customer_phone ?? ""),
        timezone: client.timezone,
      });
      return JSON.stringify({
        cancelled: true,
        appointment: { id: appointment.id, status: appointment.status },
      });
    }
    default:
      return JSON.stringify({ error: `Ferramenta desconhecida: ${toolName}` });
  }
}

export async function POST(request: NextRequest) {
  if (!isValidWebhook(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: EvolutionPayload;
  try {
    payload = (await request.json()) as EvolutionPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const instance = payload.instance;
  if (!instance) {
    return NextResponse.json({ error: "Missing instance" }, { status: 400 });
  }

  const { remoteJid, messageId, isFromMe, text, pushName } =
    extractMessage(payload);

  // Apenas mensagens de texto recebidas de clientes disparam a IA.
  if (!remoteJid || isFromMe || !text.trim() || !messageId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let client: Client | null = null;
  try {
    const { data, error } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("evolution_instance", instance)
      .maybeSingle();
    if (error) throw error;
    client = data;
  } catch (error) {
    console.error("[webhook] falha ao resolver client:", error);
    return NextResponse.json({ ok: true, error: "client_resolve_failed" });
  }

  if (!client) {
    console.warn(`[webhook] instância ${instance} sem client mapeado.`);
    return NextResponse.json({ ok: true, skipped: "no_client" });
  }

  try {
    const contactPhone = remoteJidToNumber(remoteJid);
    const conversation = await getOrCreateConversation(
      client.id,
      contactPhone,
      pushName
    );

    const history = Array.isArray(conversation.messages) ? conversation.messages : [];
    const isDuplicate = history.some(
      (m: { message_id?: string }) => (m as { message_id?: string }).message_id === messageId
    );
    if (isDuplicate) {
      return NextResponse.json({ ok: true, skipped: "duplicate" });
    }

    await persistMessage(
      conversation.id,
      {
        role: "user",
        content: text,
        message_id: messageId,
        created_at: new Date().toISOString(),
      },
      "open"
    );

    const prompt = await loadPrompt(client.id);
    const systemPrompt =
      prompt?.content ??
      "Você é o assistente de agendamento deste negócio. Ajude o cliente a verificar horários e criar ou cancelar agendamentos. Seja breve e cordial.";

    const openaiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history
        .slice(-20)
        .map((m: { role?: string; content?: string }) => ({
          role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
          content: m.content ?? "",
        })),
    ];

    let reply = "";
    let assistantOutput = await createChatCompletion({
      messages: openaiMessages,
      tools: EVOLUTION_TOOLS,
    });

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const message = assistantOutput.choices[0]?.message;
      const toolCalls = message?.tool_calls ?? [];

      if (!toolCalls.length) {
        reply = extractTextContent(message);
        break;
      }

      openaiMessages.push({
        role: "assistant",
        content: message.content,
        // next/OpenAI tipos não exigem tool_calls aqui; o nome é passado via tool role
      });

      for (const toolCall of toolCalls) {
        if (!("function" in toolCall)) continue;
        const fn = toolCall.function;
        let toolResult: string;
        try {
          const args = JSON.parse(fn.arguments || "{}");
          toolResult = await executeToolCall(fn.name, args, client);
        } catch (error) {
          const message =
            error instanceof DomainError ? error.message : "Erro interno ao executar a ação.";
          console.error("[webhook] tool call falhou:", error);
          toolResult = JSON.stringify({ error: message });
        }
        openaiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
          name: fn.name,
        });
      }

      assistantOutput = await createChatCompletion({
        messages: openaiMessages,
        tools: EVOLUTION_TOOLS,
      });
    }

    if (!reply) {
      reply =
        "Desculpe, não consegui processar sua solicitação agora. Um atendente humano será acionado.";
    }

    await sendTextMessage(instance, remoteJid, reply);

    await persistMessage(
      conversation.id,
      {
        role: "assistant",
        content: reply,
        created_at: new Date().toISOString(),
      },
      "open"
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[webhook] erro ao processar mensagem:", error);
    return NextResponse.json({ ok: true, error: "processing_failed" });
  }
}