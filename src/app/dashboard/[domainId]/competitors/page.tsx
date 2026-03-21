import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { CompetitorList } from "@/components/dashboard/competitor-list";
import { Users } from "lucide-react";
import { ScanStatusBanner } from "@/components/dashboard/scan-status-banner";
import { getCompetitorStats, type CompetitorStats } from "@/lib/scan/get-competitor-stats";

export default async function CompetitorsPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const [{ data: rawDomain }, { data: rawCompetitors }] = await Promise.all([
    supabaseAdmin.from("domains").select("id, brand_name, scan_status, first_scan_done").eq("id", domainId).eq("user_id", user.id).maybeSingle(),
    supabaseAdmin.from("competitors").select("*").eq("domain_id", domainId).order("created_at", { ascending: false }),
  ]);

  if (!rawDomain) notFound();

  const competitors = (rawCompetitors || []).map((c) => ({
    id: c.id,
    url: c.url,
    brandName: c.brand_name,
    createdAt: c.created_at,
  }));

  const statsResults = await Promise.all(
    competitors.map((comp) => getCompetitorStats(comp.id))
  );
  const competitorStats = statsResults.filter((s): s is CompetitorStats => s !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Competitors</h1>
          <p className="text-sm text-muted-foreground">
            Track competitor visibility for {rawDomain.brand_name}.
          </p>
        </div>
      </div>
      <ScanStatusBanner
        domainId={domainId}
        initialStatus={rawDomain.scan_status}
      />
      <CompetitorList
        competitors={competitors}
        domainId={domainId}
        competitorStats={competitorStats}
      />
    </div>
  );
}
