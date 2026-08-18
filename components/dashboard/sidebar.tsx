"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Menu,
  MessagesSquare,
  Settings,
  Wand2,
  X,
} from "lucide-react";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/conversas", label: "Conversas", icon: MessagesSquare },
  { href: "/dashboard/prompts", label: "Prompts", icon: Wand2 },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/setup", label: "Setup", icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

function NavigationLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Navegação principal" className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70",
              active
                ? "border border-white/10 bg-gradient-to-r from-violet-600/25 to-blue-500/25 text-white"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <aside className="glass sticky top-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 flex-col justify-between p-4 md:flex">
        <div className="space-y-6">
          <Link href="/dashboard" className="block rounded-lg px-2 py-1 text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70">
            <span className="text-gradient">Agendamento</span>IA
          </Link>
          <NavigationLinks pathname={pathname} />
        </div>
        <SignOutButton />
      </aside>

      <button
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-controls="mobile-navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="fixed right-5 top-5 z-50 inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-[#11111a]/90 text-white shadow-lg backdrop-blur-xl transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 md:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside id="mobile-navigation" aria-label="Menu móvel" className="glass absolute inset-y-0 right-0 flex w-[min(19rem,calc(100%-2rem))] flex-col p-5 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <Link href="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-1 py-1 text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70">
                <span className="text-gradient">Agendamento</span>IA
              </Link>
              <button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="inline-flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70">
                <X className="size-5" />
              </button>
            </div>
            <NavigationLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            <div className="mt-auto border-t border-white/10 pt-4">
              <SignOutButton />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
