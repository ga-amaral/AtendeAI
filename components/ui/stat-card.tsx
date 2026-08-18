import * as React from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

type StatCardTone = "violet" | "blue" | "green" | "amber";

const tones: Record<StatCardTone, string> = {
  violet:
    "border-violet-400/20 bg-gradient-to-br from-violet-500/20 to-blue-500/10 text-violet-300",
  blue: "border-blue-400/20 bg-gradient-to-br from-blue-500/20 to-violet-500/10 text-blue-300",
  green:
    "border-emerald-400/20 bg-gradient-to-br from-emerald-500/20 to-blue-500/10 text-emerald-300",
  amber:
    "border-amber-400/20 bg-gradient-to-br from-amber-500/20 to-violet-500/10 text-amber-300",
};

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
  tone?: StatCardTone;
}

function StatCard({ label, value, icon, hint, tone = "violet", className }: StatCardProps) {
  return (
    <GlassCard className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-[-0.04em] text-white">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div
            className={cn(
              "rounded-xl border bg-gradient-to-br p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
              tones[tone]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export { StatCard };
