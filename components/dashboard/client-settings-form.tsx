"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase";
import { GlassInput } from "@/components/ui/glass-input";
import { Label } from "@/components/ui/label";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Client } from "@/types";

export function ClientSettingsForm({ client }: { client: Client }) {
  const router = useRouter();
  const supabase = createClient();

  const [businessName, setBusinessName] = useState(client.business_name);
  const [businessPhone, setBusinessPhone] = useState(client.business_phone ?? "");
  const [segment, setSegment] = useState(client.segment ?? "");
  const [instance, setInstance] = useState(client.evolution_instance_name ?? "");
  const [openaiModel, setOpenaiModel] = useState(client.openai_model ?? "");
  const [evolutionApiKey, setEvolutionApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const patch: Record<string, unknown> = {
      business_name: businessName.trim(),
      business_phone: businessPhone.trim() || null,
      segment: segment.trim() || null,
      evolution_instance_name: instance.trim() || null,
      openai_model: openaiModel.trim() || null,
    };

    // Só grava as chaves se o usuário digitar um novo valor.
    if (evolutionApiKey.trim()) patch.evolution_api_key = evolutionApiKey.trim();
    if (openaiApiKey.trim()) patch.openai_api_key = openaiApiKey.trim();

    const { error } = await supabase.from("clients").update(patch).eq("id", client.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setEvolutionApiKey("");
    setOpenaiApiKey("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="business-name">Nome do negócio</Label>
        <GlassInput
          id="business-name"
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

      <div className="space-y-2">
        <Label htmlFor="instance">Instância Evolution API</Label>
        <GlassInput
          id="instance"
          placeholder="Nome da instância WhatsApp"
          value={instance}
          onChange={(e) => setInstance(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          A instância é usada para identificar qual negócio recebeu a mensagem.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="openai-model">Modelo OpenAI (opcional)</Label>
        <GlassInput
          id="openai-model"
          placeholder="gpt-4o"
          value={openaiModel}
          onChange={(e) => setOpenaiModel(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="evolution-key">Chave da instância Evolution (opcional)</Label>
        <GlassInput
          id="evolution-key"
          type="password"
          placeholder={client.evolution_api_key ? "•••••••• (já configurada)" : "Chave da instância"}
          value={evolutionApiKey}
          onChange={(e) => setEvolutionApiKey(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="openai-key">Chave OpenAI (opcional)</Label>
        <GlassInput
          id="openai-key"
          type="password"
          placeholder={client.openai_api_key ? "•••••••• (já configurada)" : "Chave da API"}
          value={openaiApiKey}
          onChange={(e) => setOpenaiApiKey(e.target.value)}
          autoComplete="off"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PrimaryButton type="submit" disabled={loading}>
        {loading ? <Spinner /> : "Salvar"}
      </PrimaryButton>
    </form>
  );
}