import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getClientForUser } from "@/lib/domain/tenants";
import { createAppointment, DomainError } from "@/lib/domain/scheduling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: {
    service_name?: string;
    starts_at?: string;
    customer_name?: string;
    customer_phone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { service_name, starts_at, customer_name, customer_phone } = body;
  if (!service_name || !starts_at || !customer_name || !customer_phone) {
    return NextResponse.json(
      { error: "Campos obrigatórios: service_name, starts_at, customer_name, customer_phone." },
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

    const appointment = await createAppointment({
      clientId: client.id,
      serviceName: service_name,
      startsAt: starts_at,
      customerName: customer_name,
      customerPhone: customer_phone,
      timezone: client.timezone,
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[create-appointment]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}