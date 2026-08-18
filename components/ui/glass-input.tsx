import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const GlassInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    className={cn(
      "min-h-11 rounded-xl bg-white/[0.055] border-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all",
      "placeholder:text-muted-foreground/60",
      "focus-visible:border-violet-400/50 focus-visible:ring-brand/50",
      className
    )}
    {...props}
  />
));
GlassInput.displayName = "GlassInput";

export { GlassInput };
