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

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("attendance_prompts").insert({
      client_id: clientId,
      name: name.trim() || "Prompt sem nome",
      content: content.trim(),
      is_active: false,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setName("");
    setContent("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prompt-name">Nome</Label>
        <GlassInput
          id="prompt-name"
          placeholder="Ex.: Atendimento padrão"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt-content">Conteúdo do prompt</Label>
        <Textarea
          id="prompt-content"
          rows={6}
          placeholder="Instruções do assistente de IA..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-white/5 border-white/10 backdrop-blur-xl"
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