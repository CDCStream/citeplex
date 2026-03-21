import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DomainList } from "@/components/dashboard/domain-list";
import { Globe } from "lucide-react";

export default async function DomainsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: rawDomains } = await supabaseAdmin
    .from("domains")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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
        industry: d.industry ?? null,
        description: d.description ?? null,
        scanStatus: d.scan_status,
        createdAt: d.created_at,
        _count: { prompts: promptCount || 0, competitors: competitorCount || 0 },
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Domains</h1>
          <p className="text-sm text-muted-foreground">
            Manage the brands you&apos;re tracking across AI search engines.
          </p>
        </div>
      </div>
      <DomainList domains={domains} />
    </div>
  );
}
