"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase";
import { GlassInput } from "@/components/ui/glass-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Spinner } from "@/components/ui/spinner";
import type { Service } from "@/types";

export function ServiceForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("services").insert({
      client_id: clientId,
      name: name.trim(),
      duration_minutes: parseInt(duration, 10) || 30,
      price: price ? parseFloat(price) : null,
      is_active: true,
    });

    if (!error) {
      setName("");
      setDuration("30");
      setPrice("");
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="svc-name">Serviço</Label>
        <GlassInput
          id="svc-name"
          placeholder="Ex.: Corte de cabelo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="svc-duration">Duração (min)</Label>
        <GlassInput
          id="svc-duration"
          type="number"
          min={5}
          step={5}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="svc-price">Preço (R$)</Label>
        <GlassInput
          id="svc-price"
          type="number"
          step="0.01"
          min="0"
          placeholder="0,00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="sm:col-span-4">
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? <Spinner /> : "Adicionar serviço"}
        </PrimaryButton>
      </div>
    </form>
  );
}

export function ServiceList({ services }: { services: Service[] }) {
  const router = useRouter();
  const supabase = createClient();

  async function toggle(service: Service) {
    await supabase
      .from("services")
      .update({ is_active: !service.is_active })
      .eq("id", service.id);
    router.refresh();
  }

  if (services.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>;
  }

  return (
    <ul className="space-y-2">
      {services.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-4 py-2.5 border border-white/5"
        >
          <div>
            <p className="font-medium">{s.name}</p>
            <p className="text-xs text-muted-foreground">
              {s.duration_minutes} min
              {s.price != null && ` · R$ ${s.price.toFixed(2).replace(".", ",")}`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => toggle(s)}>
            {s.is_active ? "Desativar" : "Ativar"}
          </Button>
        </li>
      ))}
    </ul>
  );
}