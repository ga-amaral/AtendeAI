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

  const [name, setName] = useState(client.name);
  const [timezone, setTimezone] = useState(client.timezone);
  const [instance, setInstance] = useState(client.evolution_instance ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("clients")
      .update({
        name: name.trim(),
        timezone,
        evolution_instance: instance.trim() || null,
      })
      .eq("id", client.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client-name">Nome do negócio</Label>
        <GlassInput
          id="client-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-timezone">Fuso horário</Label>
        <GlassInput
          id="client-timezone"
          placeholder="America/Sao_Paulo"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-instance">Instância Evolution API</Label>
        <GlassInput
          id="client-instance"
          placeholder="Nome da instância WhatsApp"
          value={instance}
          onChange={(e) => setInstance(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          A instância é usada para identificar qual negócio recebeu a mensagem.
        </p>
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