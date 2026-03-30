import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignupConversion } from "@/app/dashboard/signup-conversion";
import { Button } from "@/components/ui/button";
import { Globe, Plus, ArrowUpRight, Zap } from "lucide-react";
import { DomainCards } from "@/components/dashboard/domain-cards";
import { getEffectivePromptLimit } from "@/lib/prompt-limits";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const plan = user.plan || "starter";
  const promptLimit = await getEffectivePromptLimit(user.id, plan);

  const { data: rawDomains } = await supabaseAdmin
    .from("domains")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const domainIds = (rawDomains || []).map((d) => d.id);
  let totalPromptsUsed = 0;
  if (domainIds.length > 0) {
    const { count } = await supabaseAdmin
      .from("prompts")
      .select("id", { count: "exact", head: true })
      .in("domain_id", domainIds);
    totalPromptsUsed = count || 0;
  }

  const domains = await Promise.all(
    (rawDomains || []).map(async (d) => {
      const [{ count: promptCount }, { count: competitorCount }] = await Promise.all([
        supabaseAdmin.from("prompts").select("*", { count: "exact", head: true }).eq("domain_id", d.id),
        supabaseAdmin.from("competitors").select("*", { count: "exact", head: true }).eq("domain_id", d.id),
      ]);
      return {
        id: d.id,
        url: d.url,
        brandName: d.brand_name,
        scanStatus: d.scan_status,
        createdAt: d.created_at,
        _count: { prompts: promptCount || 0, competitors: competitorCount || 0 },
      };
    })
  );

  return (
    <>
      <Suspense fallback={null}>
        <SignupConversion />
      </Suspense>
      <div className="space-y-8">
      {plan === "starter" && (
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Starter Plan — {totalPromptsUsed}/{promptLimit} prompts used
              </p>
              <p className="text-xs text-muted-foreground">
                Upgrade to get more prompts, articles, and gap analysis.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="rounded-lg">
            <Link href="/pricing">
              Upgrade Plan
              <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Track your brand&apos;s AI search visibility across engines.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-xl">
          <Link href="/onboarding">
            <Plus className="mr-2 h-4 w-4" />
            Add Domain
          </Link>
        </Button>
      </div>

      {domains.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-muted-foreground/20 p-16 flex flex-col items-center justify-center">
          <Globe className="h-14 w-14 text-muted-foreground/30" />
          <h3 className="mt-5 text-xl font-semibold">No domains yet</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            Add your first domain to start tracking how AI search engines mention your brand.
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link href="/onboarding">
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Link>
          </Button>
        </div>
      ) : (
        <DomainCards domains={domains} />
      )}
      </div>
    </>
  );
}
