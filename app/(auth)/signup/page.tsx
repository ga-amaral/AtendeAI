"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { clearSupabaseAuthCookies } from "@/lib/auth-cookies";
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) {
        return;
      }
      if (user) {
        router.replace("/dashboard");
        return;
      }
      clearSupabaseAuthCookies();
    })();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

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
      if (data.session) {
        try {
          const res = await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              business_name: businessName || "Meu negócio",
              business_phone: null,
              segment: null,
            }),
          });
          const json = await res.json().catch(() => null);
          if (!res.ok) {
            setError(
              `Não foi possível criar seu negócio automaticamente (${json?.error ?? "erro desconhecido"}). Você poderá criá-lo na tela de Setup após entrar.`
            );
          }
        } catch {
          setError(
            "Não foi possível criar seu negócio automaticamente. Você poderá criá-lo na tela de Setup após entrar."
          );
        }
      }

      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <p className="eyebrow">Comece em minutos</p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Criar conta</h1>
        <p className="text-sm leading-6 text-muted-foreground">
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
        <Link href="/login" className="font-medium text-violet-300 transition-colors hover:text-violet-200 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
