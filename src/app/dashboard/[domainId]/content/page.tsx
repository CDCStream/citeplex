import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getArticleLimit } from "@/lib/plans";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ContentDashboard } from "@/components/dashboard/content-dashboard";

async function ContentPageContent({ domainId }: { domainId: string }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: rawDomain } = await supabaseAdmin
    .from("domains")
    .select("id, brand_name, description, industry")
    .eq("id", domainId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!rawDomain) notFound();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [{ data: plans }, { count: articleCount }] = await Promise.all([
    supabaseAdmin
      .from("content_plans")
      .select("*")
      .eq("domain_id", domainId)
      .gte("scheduled_date", monthStart)
      .lte("scheduled_date", monthEnd)
      .order("scheduled_date", { ascending: true }),
    supabaseAdmin
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("domain_id", domainId),
  ]);

  const articleLimit = getArticleLimit(user.plan || "starter");

  return (
    <ContentDashboard
      domainId={domainId}
      brandName={rawDomain.brand_name}
      description={rawDomain.description || ""}
      industry={rawDomain.industry || ""}
      plans={
        (plans || []).map((p) => ({
          id: p.id,
          title: p.title,
          keyword: p.keyword,
          articleType: p.article_type,
          scheduledDate: p.scheduled_date,
          status: p.status,
          articleId: p.article_id,
          keywordData: p.keyword_data as { volume?: number | null; difficulty?: number | null } | null,
        }))
      }
      articlesUsed={articleCount || 0}
      articleLimit={articleLimit}
    />
  );
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId } = await params;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ContentPageContent domainId={domainId} />
    </Suspense>
  );
}
