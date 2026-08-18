import OpenAI from "openai";

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

export function getOpenAI(apiKey?: string): OpenAI {
  const key = apiKey ?? process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY não configurada no ambiente do servidor.");
  }
  return new OpenAI({ apiKey: key });
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
        "Verifica horários disponíveis para um serviço em uma data específica. Retorna a lista de slots livres (start_time e end_time em HH:mm).",
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
        "Cria um agendamento para um cliente, validando se a data e o horário escolhidos ainda estão disponíveis.",
      parameters: {
        type: "object",
        properties: {
          service_name: {
            type: "string",
            description: "Nome do serviço agendado.",
          },
          date: {
            type: "string",
            description: "Data do agendamento no formato YYYY-MM-DD (fuso local do negócio).",
          },
          time: {
            type: "string",
            description: "Horário de início no formato HH:mm (24h, fuso local do negócio).",
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
        required: ["service_name", "date", "time", "customer_name", "customer_phone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_appointment",
      description:
        "Cancela um agendamento existente do cliente, localizando pelo serviço, data e horário.",
      parameters: {
        type: "object",
        properties: {
          service_name: {
            type: "string",
            description: "Nome do serviço do agendamento a cancelar.",
          },
          date: {
            type: "string",
            description: "Data do agendamento no formato YYYY-MM-DD.",
          },
          time: {
            type: "string",
            description: "Horário de início do agendamento no formato HH:mm.",
          },
          customer_phone: {
            type: "string",
            description: "Número do cliente (somente dígitos) para identificar o agendamento.",
          },
        },
        required: ["service_name", "date", "time", "customer_phone"],
      },
    },
  },
];

export interface ChatCompletionParams {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  maxTokens?: number;
  /** Chave OpenAI específica do tenant (fallback: OPENAI_API_KEY). */
  apiKey?: string;
  /** Modelo específico do tenant (fallback: OPENAI_MODEL). */
  model?: string;
}

export async function createChatCompletion({
  messages,
  tools,
  maxTokens = 800,
  apiKey,
  model,
}: ChatCompletionParams) {
  return getOpenAI(apiKey).chat.completions.create({
    model: model ?? OPENAI_MODEL,
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