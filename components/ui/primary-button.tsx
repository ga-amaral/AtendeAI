import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium",
          "bg-gradient-to-r from-violet-600 to-blue-500 text-white",
          "shadow-[0_4px_20px_rgba(124,58,237,0.35)]",
          "transition-all duration-300 hover:shadow-[0_4px_28px_rgba(124,58,237,0.55)] hover:brightness-110",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          "[&_svg]:size-4 [&_svg]:shrink-0",
          className
        )}
        {...props}
      />
    );
  }
);
PrimaryButton.displayName = "PrimaryButton";

export { PrimaryButton };