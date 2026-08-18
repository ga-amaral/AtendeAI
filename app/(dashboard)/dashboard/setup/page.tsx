import { getDashboardContext } from "@/lib/dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { ClientSettingsForm } from "@/components/dashboard/client-settings-form";
import { ServiceForm, ServiceList } from "@/components/dashboard/service-form";
import {
  WorkingHoursForm,
  WorkingHoursList,
} from "@/components/dashboard/working-hours-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const { client, supabase } = await getDashboardContext();

  if (!client) {
    return (
      <div className="space-y-6">
        <PageHeader title="Setup" />
        <GlassCard className="p-5 sm:p-6">
          <p className="text-sm text-muted-foreground">
            Você ainda não possui um negócio cadastrado. Finalize o cadastro de
            conta e crie seu tenant para continuar.
          </p>
        </GlassCard>
      </div>
    );
  }

  const [servicesResult, hoursResult] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("client_id", client.id)
      .order("name"),
    supabase
      .from("working_hours")
      .select("*")
      .eq("client_id", client.id)
      .order("day_of_week"),
  ]);

  const services = servicesResult.data ?? [];
  const hours = hoursResult.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Setup"
        description="Configure seu negócio, serviços, horários e a integração do WhatsApp."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="p-5 sm:p-6">
          <h2 className="mb-4 font-semibold">Dados do negócio</h2>
          <ClientSettingsForm client={client} />
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-4 font-semibold">Serviços</h2>
          <ServiceForm clientId={client.id} />
          <div className="mt-4">
            <ServiceList services={services} />
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="mb-4 font-semibold">Horários de funcionamento</h2>
        <WorkingHoursForm clientId={client.id} />
        <div className="mt-4">
          <WorkingHoursList hours={hours} />
        </div>
      </GlassCard>
    </div>
  );
}
