"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type AIOrbState = "idle" | "thinking" | "responding";

const STATE_LABEL: Record<AIOrbState, string> = {
  idle: "Em espera",
  thinking: "Pensando",
  responding: "Respondendo",
};

const STATE_DESC: Record<AIOrbState, string> = {
  idle: "Monitorando seu WhatsApp",
  thinking: "Processando a mensagem do cliente",
  responding: "Enviando resposta ao cliente",
};

const STATE_DOT: Record<AIOrbState, string> = {
  idle: "bg-violet-400/70",
  thinking: "bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]",
  responding: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]",
};

function useAIOrbState(
  auto: boolean,
  state: AIOrbState,
  lastActivityAt?: string | null
): AIOrbState {
  const [current, setCurrent] = React.useState<AIOrbState>(state);

  React.useEffect(() => {
    if (!auto) {
      setCurrent(state);
      return;
    }

    setCurrent("idle");

    const hasRecent =
      lastActivityAt != null &&
      Date.now() - new Date(lastActivityAt).getTime() < 2 * 60 * 1000;

    if (hasRecent) {
      const sequence: AIOrbState[] = [
        "thinking",
        "responding",
        "responding",
        "thinking",
        "idle",
      ];
      let i = 0;
      const interval = window.setInterval(() => {
        setCurrent(sequence[i % sequence.length]);
        i += 1;
      }, 2800);
      return () => window.clearInterval(interval);
    }

    const interval = window.setInterval(() => {
      setCurrent("thinking");
      window.setTimeout(() => setCurrent("idle"), 2200);
    }, 11000);
    return () => window.clearInterval(interval);
  }, [auto, state, lastActivityAt]);

  return current;
}

interface AIOrbProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: AIOrbState;
  auto?: boolean;
  lastActivityAt?: string | null;
  /** Passa para --orb-size (aceita clamp, rem, etc). */
  size?: string;
  showLabel?: boolean;
}

function AIOrb({
  state = "idle",
  auto = true,
  lastActivityAt,
  size = "clamp(8.5rem, 10vw, 10.5rem)",
  showLabel = true,
  className,
}: AIOrbProps) {
  const activeState = useAIOrbState(auto, state, lastActivityAt);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        className="ai-orb"
        data-state={activeState}
        style={{ "--orb-size": size } as React.CSSProperties}
      >
        <div className="ai-orb__halo" />
        <div className="ai-orb__ring ai-orb__ring--outer" />
        <div className="ai-orb__ring ai-orb__ring--inner" />
        <div className="ai-orb__ring ai-orb__ring--dash" />
        <div className="ai-orb__orbit ai-orb__orbit--a">
          <span className="ai-orb__particle" />
        </div>
        <div className="ai-orb__orbit ai-orb__orbit--b">
          <span className="ai-orb__particle ai-orb__particle--blue" />
        </div>
        <div className="ai-orb__orbit ai-orb__orbit--c">
          <span className="ai-orb__particle" />
        </div>
        <span className="ai-orb__wave" />
        <span className="ai-orb__wave ai-orb__wave--2" />
        <span className="ai-orb__wave ai-orb__wave--3" />
        <div className="ai-orb__core" />
      </div>

      {showLabel && (
        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              "size-2 rounded-full transition-colors duration-300",
              STATE_DOT[activeState]
            )}
          />
          <span className="font-medium text-white">{STATE_LABEL[activeState]}</span>
          <span className="hidden text-muted-foreground sm:inline">
            {STATE_DESC[activeState]}
          </span>
        </div>
      )}
    </div>
  );
}

export { AIOrb };