import Link from "next/link";

import { GlassCard } from "@/components/ui/glass-card";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"
      />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-gradient">Agendamento</span>IA
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Agendamentos pelo WhatsApp com IA
          </p>
        </div>

        <GlassCard className="p-8">{children}</GlassCard>
      </div>
    </div>
  );
}