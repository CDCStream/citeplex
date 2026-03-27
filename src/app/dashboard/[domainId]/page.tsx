import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Eye, ArrowRight } from "lucide-react";
import { getDomainStats } from "@/lib/scan/get-domain-stats";
import { Favicon } from "@/components/ui/favicon";
import { VisibilityScoreCard } from "@/components/dashboard/visibility-score-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CompetitorChart } from "@/components/dashboard/competitor-chart";
import { PromptEngineMatrix } from "@/components/dashboard/prompt-engine-matrix";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ScanStatusBanner } from "@/components/dashboard/scan-status-banner";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import Link from "next/link";

async function DomainDashboardContent({ domainId }: { domainId: string }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const [{ data: rawDomain }, { count: promptCount }, { count: scanResultCount }] = await Promise.all([
    supabaseAdmin.from("domains").select("*").eq("id", domainId).eq("user_id", user.id).maybeSingle(),
    supabaseAdmin.from("prompts").select("*", { count: "exact", head: true }).eq("domain_id", domainId),
    supabaseAdmin.from("scan_results").select("*", { count: "exact", head: true }).eq("domain_id", domainId),
  ]);

  if (!rawDomain) notFound();

  const domain = {
    id: rawDomain.id,
    url: rawDomain.url,
    brandName: rawDomain.brand_name,
    scanStatus: rawDomain.scan_status,
    firstScanDone: rawDomain.first_scan_done,
    createdAt: rawDomain.created_at,
    _count: {
      prompts: promptCount || 0,
      scanResults: scanResultCount || 0,
    },
  };

  const hasPrompts = domain._count.prompts > 0;
  const hasScans = domain._count.scanResults > 0;
  const isFirstScanRunning = !domain.firstScanDone && domain.scanStatus === "scanning";

  const stats = hasScans && !isFirstScanRunning ? await getDomainStats(domainId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Favicon url={domain.url} size={28} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{domain.brandName}</h1>
            <p className="text-sm text-muted-foreground">{domain.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {stats?.lastScan && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Last scan: {stats.lastScan}
            </span>
          )}
          {domain.scanStatus === "scanning" && (
            <Badge variant="secondary" className="gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Scanning
            </Badge>
          )}
        </div>
      </div>

      <ScanStatusBanner
        domainId={domainId}
        initialStatus={domain.scanStatus}
        isFirstScan={!domain.firstScanDone}
      />

      {isFirstScanRunning && <AutoRefresh intervalMs={5000} />}

      {!hasPrompts && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-2xl bg-primary/10 p-4 mb-4">
              <Eye className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mt-2 text-lg font-semibold">Set up AI Visibility Tracking</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
              Choose prompts to track how AI engines mention your brand. Get daily visibility scores, sentiment analysis, and actionable insights.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href={`/dashboard/${domainId}/ai-visibility`}>
                <Eye className="mr-2 h-4 w-4" />
                Set Up AI Visibility
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasPrompts && !hasScans && !isFirstScanRunning && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Clock className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No scan results yet</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
              Your first scan will run shortly. Check back soon for results.
            </p>
          </CardContent>
        </Card>
      )}

      {stats && (
        <>
          <VisibilityScoreCard
            mentionRate={stats.mentionRate}
            avgPosition={stats.avgPosition}
            sentimentBreakdown={stats.sentimentBreakdown}
            lastScan={stats.lastScan}
            engineBreakdown={stats.engineBreakdown}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <TrendChart
              data={stats.dailyTrend}
              trendRaw={stats.trendRaw}
              competitorTrendRaw={stats.competitorTrendRaw}
            />
            <CompetitorChart data={stats.competitorComparison} />
          </div>
          <PromptEngineMatrix rows={stats.promptResults} />
        </>
      )}
    </div>
  );
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId } = await params;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DomainDashboardContent domainId={domainId} />
    </Suspense>
  );
}
