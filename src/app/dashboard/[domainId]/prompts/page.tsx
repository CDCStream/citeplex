import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { PromptList } from "@/components/dashboard/prompt-list";
import { MessageSquare } from "lucide-react";
import { ScanStatusBanner } from "@/components/dashboard/scan-status-banner";
import { getPromptLimit } from "@/lib/plans";

export default async function PromptsPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const promptLimit = getPromptLimit(user.plan || "free");

  const [{ data: rawDomain }, { data: rawPrompts }, { data: userDomains }] = await Promise.all([
    supabaseAdmin.from("domains").select("id, brand_name, scan_status, first_scan_done").eq("id", domainId).eq("user_id", user.id).maybeSingle(),
    supabaseAdmin.from("prompts").select("*").eq("domain_id", domainId).order("created_at", { ascending: false }),
    supabaseAdmin.from("domains").select("id").eq("user_id", user.id),
  ]);

  if (!rawDomain) notFound();

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
    createdAt: p.created_at,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prompts</h1>
          <p className="text-sm text-muted-foreground">
            Manage the prompts used to scan AI engines for {rawDomain.brand_name}.
          </p>
        </div>
      </div>
      <ScanStatusBanner
        domainId={domainId}
        initialStatus={rawDomain.scan_status}
        isFirstScan={!rawDomain.first_scan_done}
      />
      <PromptList
        prompts={prompts}
        domainId={domainId}
        promptLimit={promptLimit}
        totalPromptsUsed={totalPromptsUsed}
      />
    </div>
  );
}
