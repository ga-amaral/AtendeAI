import Link from "next/link";

import { GlassCard } from "@/components/ui/glass-card";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"
      />

      <div className="w-full max-w-md animate-in fade-in-0 slide-in-from-bottom-3 duration-700">
        <div className="mb-7 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="size-2 rounded-full bg-gradient-to-br from-violet-400 to-blue-400 shadow-[0_0_18px_rgba(124,58,237,0.9)]" />
            <span className="text-gradient">Agendamento</span>IA
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Agendamentos pelo WhatsApp com IA
          </p>
        </div>

        <GlassCard className="p-6 sm:p-8">{children}</GlassCard>
      </div>
    </div>
  );
}
