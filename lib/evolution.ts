function getConfig() {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  if (!baseUrl) {
    throw new Error("EVOLUTION_API_URL não configurada no ambiente do servidor.");
  }
  if (!apiKey) {
    throw new Error("EVOLUTION_API_KEY não configurada no ambiente do servidor.");
  }
  return { baseUrl, apiKey };
}

async function request(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const { baseUrl, apiKey } = getConfig();
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
      ...(init.headers ?? {}),
    },
  });
}

function assertOk(res: Response, context: string): Promise<unknown> {
  if (!res.ok) {
    return res.text().then((body) => {
      throw new Error(
        `Evolution API ${context} falhou (${res.status}): ${body.slice(0, 500)}`
      );
    });
  }
  return res.json().catch(() => ({}));
}

/** Remove sufixos de grupo/usuário e mantém apenas o número. */
export function remoteJidToNumber(remoteJid: string): string {
  return remoteJid.split("@")[0].replace(/\D/g, "");
}

/** Envia uma mensagem de texto via Evolution API. */
export async function sendTextMessage(
  instance: string,
  to: string,
  text: string
): Promise<unknown> {
  const number = remoteJidToNumber(to);
  const res = await request(`/message/sendText/${instance}`, {
    method: "POST",
    body: JSON.stringify({ number, text }),
  });
  return assertOk(res, "sendText");
}

/** Cria uma instância WhatsApp na Evolution API. */
export async function createInstance(instanceName: string): Promise<unknown> {
  const res = await request("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      integration: "WHATSAPP-BAILEYS",
    }),
  });
  return assertOk(res, "createInstance");
}

/** Retorna o estado de conexão de uma instância. */
export async function getInstanceStatus(instance: string): Promise<unknown> {
  const res = await request(`/instance/connectionState/${instance}`);
  return assertOk(res, "connectionState");
}

/** Verifica se a instância existe. */
export async function instanceExists(instance: string): Promise<boolean> {
  try {
    const res = await request(`/instance/fetchInstances?instanceName=${instance}`);
    if (!res.ok) return false;
    const data = (await res.json()) as unknown[];
    return Array.isArray(data) && data.some((i) => (i as { instanceName?: string }).instanceName === instance);
  } catch {
    return false;
  }
}