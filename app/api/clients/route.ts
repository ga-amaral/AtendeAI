import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: {
    business_name?: unknown;
    business_phone?: unknown;
    segment?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const businessName =
    typeof body.business_name === "string" ? body.business_name.trim() : "";
  if (!businessName) {
    return NextResponse.json(
      { error: "O nome do negócio é obrigatório." },
      { status: 400 }
    );
  }

  const businessPhone =
    typeof body.business_phone === "string" && body.business_phone.trim()
      ? body.business_phone.trim()
      : null;
  const segment =
    typeof body.segment === "string" && body.segment.trim()
      ? body.segment.trim()
      : null;

  const { data: existing } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ client: existing as Client }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      business_name: businessName,
      business_phone: businessPhone,
      segment,
      active: true,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[clients] criação do tenant falhou:", error);
    return NextResponse.json(
      { error: `Não foi possível criar o negócio: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ client: data as Client }, { status: 201 });
}