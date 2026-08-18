import Link from "next/link";
import {
  LayoutDashboard,
  MessagesSquare,
  Wand2,
  CalendarDays,
  Settings,
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

export function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="glass sticky top-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 flex-col justify-between p-4 md:flex">
      <div className="space-y-6">
        <Link href="/dashboard" className="block px-2 text-lg font-bold tracking-tight">
          <span className="text-gradient">Agendamento</span>IA
        </Link>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-gradient-to-r from-violet-600/25 to-blue-500/25 text-white border border-white/10"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        <SignOutButton />
      </div>
    </aside>
  );
}