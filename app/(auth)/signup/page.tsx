"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase";
import { GlassInput } from "@/components/ui/glass-input";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { business_name: businessName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      setInfo(
        "Conta criada! Verifique seu e-mail para confirmar antes de entrar."
      );
      setLoading(false);
      return;
    }

    if (data.user) {
      try {
        // Cria o tenant inicial do usuário (best-effort; RLS garante owner_user_id).
        await supabase.from("clients").insert({
          owner_user_id: data.user.id,
          name: businessName || "Meu negócio",
          timezone: "America/Sao_Paulo",
        });
      } catch {
        // Não bloqueia o fluxo; o setup pode concluir depois.
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Comece a automatizar seus agendamentos no WhatsApp.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="business">Nome do negócio</Label>
        <GlassInput
          id="business"
          placeholder="Ex.: Studio Bella"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <GlassInput
          id="email"
          type="email"
          required
          placeholder="voce@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <GlassInput
          id="password"
          type="password"
          required
          minLength={6}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {info && (
        <Alert>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      )}

      <PrimaryButton type="submit" disabled={loading} className="w-full">
        {loading ? <Spinner /> : "Criar conta"}
      </PrimaryButton>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="text-brand font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}