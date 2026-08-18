import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getClientForUser } from "@/lib/domain/tenants";
import { checkAvailability, DomainError } from "@/lib/domain/scheduling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { service_name?: string; date?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const serviceName = body.service_name?.trim();
  const date = body.date;

  if (!serviceName || !date) {
    return NextResponse.json(
      { error: "Campos obrigatórios: service_name, date." },
      { status: 400 }
    );
  }

  try {
    const client = await getClientForUser(user.id);
    if (!client) {
      return NextResponse.json(
        { error: "Nenhum negócio (tenant) associado à sua conta." },
        { status: 403 }
      );
    }

    const slots = await checkAvailability(client.id, serviceName, date);
    return NextResponse.json({
      service_name: serviceName,
      date,
      available: slots.length > 0,
      slots,
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[check-availability]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}