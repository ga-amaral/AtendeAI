import Link from "next/link";

import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton } from "@/components/ui/primary-button";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl"
      />

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          <span className="text-gradient">AgendamentoIA</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          Automatize agendamentos pelo WhatsApp com IA. O assistente conversa
          com seus clientes, consulta sua agenda e cria ou cancela compromissos
          em segundos.
        </p>

        <div className="mx-auto mt-8 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
          <Link href="/login" className="sm:w-auto">
            <PrimaryButton className="w-full sm:w-auto">Entrar</PrimaryButton>
          </Link>
          <Link href="/signup" className="sm:w-auto">
            <PrimaryButton className="w-full bg-gradient-to-r from-white/10 to-white/5 text-white shadow-none hover:brightness-110 sm:w-auto">
              Criar conta gratuita
            </PrimaryButton>
          </Link>
        </div>
      </div>

      <div className="relative z-10 mt-12 grid w-full max-w-4xl grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-3">
        {[
          {
            title: "IA no WhatsApp",
            desc: "Conversa natural com seus clientes 24/7.",
          },
          {
            title: "Agenda protegida",
            desc: "Sem dupla reserva: validação de conflitos por tenant.",
          },
          {
            title: "Painel completo",
            desc: "Conversas, prompts, agenda e configuração em um só lugar.",
          },
        ].map((f) => (
          <GlassCard key={f.title} className="p-5 text-left sm:p-6">
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
