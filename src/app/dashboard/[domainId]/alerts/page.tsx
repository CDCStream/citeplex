import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { AlertsList } from "@/components/dashboard/alerts-list";
import { Bell } from "lucide-react";

export default async function AlertsPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: rawDomain } = await supabaseAdmin
    .from("domains")
    .select("id")
    .eq("id", domainId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!rawDomain) notFound();

  const { data: rawAlerts } = await supabaseAdmin
    .from("alerts")
    .select("*")
    .eq("domain_id", domainId)
    .order("created_at", { ascending: false });

  const alerts = (rawAlerts || []).map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    isRead: a.is_read,
    createdAt: a.created_at,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Notifications about significant changes in your visibility.
          </p>
        </div>
      </div>
      <AlertsList alerts={alerts} domainId={domainId} />
    </div>
  );
}
