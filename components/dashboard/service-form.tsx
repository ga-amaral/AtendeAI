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
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("services").insert({
      client_id: clientId,
      name: name.trim(),
      description: description.trim() || null,
      duration: parseInt(duration, 10) || 30,
      price: price ? parseFloat(price) : null,
      active: true,
    });

    if (!error) {
      setName("");
      setDescription("");
      setDuration("30");
      setPrice("");
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
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
      </div>
      <div className="space-y-1">
        <Label htmlFor="svc-desc">Descrição (opcional)</Label>
        <GlassInput
          id="svc-desc"
          placeholder="Ex.: Inclui lavagem e finalização"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <PrimaryButton type="submit" disabled={loading}>
        {loading ? <Spinner /> : "Adicionar serviço"}
      </PrimaryButton>
    </form>
  );
}

export function ServiceList({ services }: { services: Service[] }) {
  const router = useRouter();
  const supabase = createClient();

  async function toggle(service: Service) {
    await supabase
      .from("services")
      .update({ active: !service.active })
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
          className="surface-inset flex flex-col items-start justify-between gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-3"
        >
          <div>
            <p className="font-medium">{s.name}</p>
            <p className="text-xs text-muted-foreground">
              {s.duration} min
              {s.price != null && ` · R$ ${s.price.toFixed(2).replace(".", ",")}`}
              {s.description ? ` · ${s.description}` : ""}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => toggle(s)}>
            {s.active ? "Desativar" : "Ativar"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
