import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getEffectivePromptLimit } from "@/lib/prompt-limits";
import { getDomainStats } from "@/lib/scan/get-domain-stats";
import { AiVisibilitySetup } from "@/components/dashboard/ai-visibility-setup";
import { AiVisibilityActive } from "@/components/dashboard/ai-visibility-active";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

async function AiVisibilityContent({ domainId }: { domainId: string }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const [{ data: rawDomain }, { data: rawPrompts }, { count: scanResultCount }] =
    await Promise.all([
      supabaseAdmin
        .from("domains")
        .select("id, brand_name, url, description, industry, scan_status, first_scan_done, primary_country, target_countries")
        .eq("id", domainId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabaseAdmin
        .from("prompts")
        .select("*")
        .eq("domain_id", domainId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("scan_results")
        .select("*", { count: "exact", head: true })
        .eq("domain_id", domainId),
    ]);

  if (!rawDomain) notFound();

  const promptLimit = await getEffectivePromptLimit(user.id, user.plan || "starter");

  const { data: userDomains } = await supabaseAdmin
    .from("domains")
    .select("id")
    .eq("user_id", user.id);

  const domainIds = userDomains?.map((d) => d.id) || [];
  let totalPromptsUsed = 0;
  if (domainIds.length > 0) {
    const { count } = await supabaseAdmin
      .from("prompts")
      .select("id", { count: "exact", head: true })
      .in("domain_id", domainIds);
    totalPromptsUsed = count || 0;
  }

  const prompts = (rawPrompts || []).map((p) => ({
    id: p.id,
    text: p.text,
    category: p.category,
    language: p.language,
    country: p.country,
    isActive: p.is_active,
    createdAt: new Date(p.created_at),
  }));

  const hasPrompts = prompts.length > 0;
  const hasScans = (scanResultCount || 0) > 0;
  const isScanning = rawDomain.scan_status === "scanning";

  const stats =
    hasScans && !isScanning ? await getDomainStats(domainId) : null;

  if (!hasPrompts) {
    return (
      <AiVisibilitySetup
        domainId={domainId}
        brandName={rawDomain.brand_name}
        description={rawDomain.description || ""}
        industry={rawDomain.industry || ""}
        primaryCountry={rawDomain.primary_country || "US"}
        targetCountries={
          rawDomain.target_countries
            ? JSON.parse(rawDomain.target_countries)
            : ["US"]
        }
        promptLimit={promptLimit}
        totalPromptsUsed={totalPromptsUsed}
      />
    );
  }

  return (
    <AiVisibilityActive
      domainId={domainId}
      brandName={rawDomain.brand_name}
      prompts={prompts}
      promptLimit={promptLimit}
      totalPromptsUsed={totalPromptsUsed}
      hasScans={hasScans}
      isScanning={isScanning}
      stats={stats}
    />
  );
}

export default async function AiVisibilityPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId } = await params;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AiVisibilityContent domainId={domainId} />
    </Suspense>
  );
}
