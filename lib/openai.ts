import OpenAI from "openai";

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada no ambiente do servidor.");
  }
  return new OpenAI({ apiKey });
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  tool_call_id?: string;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export const EVOLUTION_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description:
        "Verifica horários disponíveis para um serviço em uma data específica. Retorna a lista de slots livres.",
      parameters: {
        type: "object",
        properties: {
          service_name: {
            type: "string",
            description: "Nome do serviço que o cliente deseja agendar.",
          },
          date: {
            type: "string",
            description: "Data desejada no formato YYYY-MM-DD (fuso local do negócio).",
          },
        },
        required: ["service_name", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description:
        "Cria um agendamento para um cliente, validando se o horário escolhido ainda está disponível.",
      parameters: {
        type: "object",
        properties: {
          service_name: {
            type: "string",
            description: "Nome do serviço agendado.",
          },
          starts_at: {
            type: "string",
            description: "Data e hora de início no formato ISO 8601 com fuso local do negócio (ex.: 2025-03-10T14:00:00-03:00).",
          },
          customer_name: {
            type: "string",
            description: "Nome do cliente final (remetente do WhatsApp).",
          },
          customer_phone: {
            type: "string",
            description: "Número do cliente com código do país (somente dígitos).",
          },
        },
        required: ["service_name", "starts_at", "customer_name", "customer_phone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_appointment",
      description:
        "Cancela um agendamento existente do cliente, localizando pelo serviço e horário.",
      parameters: {
        type: "object",
        properties: {
          service_name: {
            type: "string",
            description: "Nome do serviço do agendamento a cancelar.",
          },
          starts_at: {
            type: "string",
            description: "Data e hora de início do agendamento no formato ISO 8601.",
          },
          customer_phone: {
            type: "string",
            description: "Número do cliente (somente dígitos) para identificar o agendamento.",
          },
        },
        required: ["service_name", "starts_at", "customer_phone"],
      },
    },
  },
];

export interface ChatCompletionParams {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  maxTokens?: number;
}

export async function createChatCompletion({
  messages,
  tools,
  maxTokens = 800,
}: ChatCompletionParams) {
  return getOpenAI().chat.completions.create({
    model: OPENAI_MODEL,
    messages: messages as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    tools,
    tool_choice: "auto",
    max_tokens: maxTokens,
    temperature: 0.4,
  });
}

/** Extrai a mensagem de texto de uma choice (ignorando tool calls). */
export function extractTextContent(
  message: OpenAI.Chat.Completions.ChatCompletionMessage
): string {
  return message.content ?? "";
}