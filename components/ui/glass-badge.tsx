import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type GlassBadgeProps = React.ComponentProps<typeof Badge> & {
  tone?: "default" | "violet" | "blue" | "green" | "red" | "muted";
};

const tones: Record<NonNullable<GlassBadgeProps["tone"]>, string> = {
  default: "bg-white/10 text-white border-white/20",
  violet: "bg-violet-500/20 text-violet-300 border-violet-400/30",
  blue: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  green: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
  red: "bg-red-500/20 text-red-300 border-red-400/30",
  muted: "bg-white/5 text-muted-foreground border-white/10",
};

function GlassBadge({ className, tone = "default", ...props }: GlassBadgeProps) {
  return (
    <Badge
      className={cn(
        "rounded-full border font-medium backdrop-blur-xl",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export { GlassBadge };