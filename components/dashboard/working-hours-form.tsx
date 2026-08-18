"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase";
import { GlassInput } from "@/components/ui/glass-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Spinner } from "@/components/ui/spinner";
import type { WorkingHours } from "@/types";

const DAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export function WorkingHoursForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [day, setDay] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("working_hours").insert({
      client_id: clientId,
      day_of_week: parseInt(day, 10),
      start_time: start,
      end_time: end,
      is_available: true,
    });

    if (!error) setDay("1");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="wh-day">Dia</Label>
        <select
          id="wh-day"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="flex h-9 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          {DAYS.map((d, i) => (
            <option key={i} value={i} className="bg-background text-foreground">
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="wh-start">Início</Label>
        <GlassInput
          id="wh-start"
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="wh-end">Fim</Label>
        <GlassInput
          id="wh-end"
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          required
        />
      </div>
      <div className="flex items-end">
        <PrimaryButton type="submit" disabled={loading} className="w-full">
          {loading ? <Spinner /> : "Adicionar"}
        </PrimaryButton>
      </div>
    </form>
  );
}

export function WorkingHoursList({ hours }: { hours: WorkingHours[] }) {
  const router = useRouter();
  const supabase = createClient();

  async function toggle(h: WorkingHours) {
    await supabase
      .from("working_hours")
      .update({ is_available: !h.is_available })
      .eq("id", h.id);
    router.refresh();
  }

  if (hours.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum horário de funcionamento cadastrado.
      </p>
    );
  }

  const sorted = [...hours].sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <ul className="space-y-2">
      {sorted.map((h) => (
        <li
          key={h.id}
          className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-4 py-2.5 border border-white/5"
        >
          <div>
            <p className="font-medium">
              {DAYS[h.day_of_week] ?? `Dia ${h.day_of_week}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {h.start_time} às {h.end_time}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => toggle(h)}>
            {h.is_available ? "Indisponível" : "Disponível"}
          </Button>
        </li>
      ))}
    </ul>
  );
}