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
      "bg-white/5 border-white/10 backdrop-blur-xl",
      "placeholder:text-muted-foreground/60",
      "focus-visible:ring-brand/50",
      className
    )}
    {...props}
  />
));
GlassInput.displayName = "GlassInput";

export { GlassInput };