import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { getClientForUser } from "@/lib/domain/tenants";
import { Sidebar } from "@/components/dashboard/sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let clientName: string | null = null;
  try {
    const client = await getClientForUser(user.id);
    clientName = client?.business_name ?? null;
  } catch {
    // Sem tenant ainda: o setup orienta o usuário a configurar.
  }

  const pathname = headers().get("x-pathname") ?? "/dashboard";

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl gap-4 px-4 py-4 pb-24 md:pb-4">
      <Sidebar pathname={pathname} />

      <main className="min-w-0 flex-1 space-y-7 py-1 md:py-2">
        <header className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-2.5">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            {clientName ? `Operando como ${clientName}` : "Configure seu negócio para começar"}
          </p>
        </header>
        {children}
      </main>
    </div>
  );
}
