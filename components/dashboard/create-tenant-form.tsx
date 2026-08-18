"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { GlassInput } from "@/components/ui/glass-input";
import { Label } from "@/components/ui/label";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CreateTenantForm() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [segment, setSegment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          business_phone: businessPhone,
          segment,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          json?.error ?? "Não foi possível criar o negócio. Tente novamente."
        );
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError(
        "Não foi possível criar o negócio. Verifique sua conexão e tente novamente."
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="business-name">Nome do negócio</Label>
        <GlassInput
          id="business-name"
          placeholder="Ex.: Studio Bella"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="business-phone">Telefone (WhatsApp)</Label>
        <GlassInput
          id="business-phone"
          placeholder="5511999999999"
          value={businessPhone}
          onChange={(e) => setBusinessPhone(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="segment">Segmento</Label>
        <GlassInput
          id="segment"
          placeholder="Ex.: Barbearia, Estética, Clínica..."
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PrimaryButton type="submit" disabled={loading} className="w-full">
        {loading ? <Spinner /> : "Criar meu negócio"}
      </PrimaryButton>
    </form>
  );
}