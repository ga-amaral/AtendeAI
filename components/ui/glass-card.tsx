import * as React from "react";

import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "glass relative overflow-hidden",
        "shadow-[0_12px_40px_rgba(0,0,0,0.28)]",
        hover && "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(0,0,0,0.38)]",
        className
      )}
      {...props}
    />
  )
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
