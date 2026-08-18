import * as React from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-violet-300/20 bg-gradient-to-b from-violet-500/[0.05] to-transparent px-6 py-12 text-center",
        className
      )}
    >
      {icon && <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-violet-300">{icon}</div>}
      <p className="font-medium tracking-tight">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { EmptyState };
