"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase";
import { GlassInput } from "@/components/ui/glass-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PromptForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [systemPrompt, setSystemPrompt] = useState("");
  const [greeting, setGreeting] = useState("");
  const [fallback, setFallback] = useState("");
  const [businessRules, setBusinessRules] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let rules: unknown = null;
    if (businessRules.trim()) {
      try {
        rules = JSON.parse(businessRules);
      } catch {
        setError("business_rules deve ser um JSON válido (ou deixe vazio).");
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase.from("attendance_prompts").insert({
      client_id: clientId,
      system_prompt: systemPrompt.trim(),
      business_rules: rules,
      greeting_message: greeting.trim() || null,
      fallback_message: fallback.trim() || null,
      active: false,
      version: 1,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSystemPrompt("");
    setGreeting("");
    setFallback("");
    setBusinessRules("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="system-prompt">Prompt do sistema</Label>
        <Textarea
          id="system-prompt"
          rows={6}
          placeholder="Instruções do assistente de IA..."
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="bg-white/5 border-white/10 backdrop-blur-xl"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="greeting">Mensagem de boas-vindas</Label>
        <GlassInput
          id="greeting"
          placeholder="Olá! Como posso ajudar hoje?"
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fallback">Mensagem de fallback</Label>
        <GlassInput
          id="fallback"
          placeholder="Usada quando o assistente não consegue responder."
          value={fallback}
          onChange={(e) => setFallback(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="business-rules">Regras do negócio (JSON opcional)</Label>
        <Textarea
          id="business-rules"
          rows={3}
          placeholder='{"exigir_deposito": true, "aviso_antecedencia_horas": 24}'
          value={businessRules}
          onChange={(e) => setBusinessRules(e.target.value)}
          className="bg-white/5 border-white/10 backdrop-blur-xl font-mono text-xs"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PrimaryButton type="submit" disabled={loading}>
        {loading ? <Spinner /> : "Criar prompt"}
      </PrimaryButton>
    </form>
  );
}