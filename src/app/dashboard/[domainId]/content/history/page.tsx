import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ContentHistoryClient } from "@/components/dashboard/content-history";

async function ContentHistoryContent({ domainId }: { domainId: string }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("id, brand_name")
    .eq("id", domainId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!domain) notFound();

  const { data: articles } = await supabaseAdmin
    .from("articles")
    .select(
      "id, title, slug, meta_description, cover_image, word_count, target_keyword, tags, seo_score, status, published_to, published_at, created_at, updated_at"
    )
    .eq("domain_id", domainId)
    .order("created_at", { ascending: false });

  const { data: integrations } = await supabaseAdmin
    .from("publish_integrations")
    .select("id, platform, is_active")
    .eq("domain_id", domainId)
    .eq("is_active", true);

  return (
    <ContentHistoryClient
      domainId={domainId}
      brandName={domain.brand_name}
      articles={(articles || []).map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        metaDescription: a.meta_description,
        coverImage: a.cover_image,
        wordCount: a.word_count,
        targetKeyword: a.target_keyword,
        tags: a.tags || [],
        seoScore: a.seo_score,
        status: a.status,
        publishedTo: a.published_to || [],
        publishedAt: a.published_at,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      }))}
      integrations={(integrations || []).map((i) => ({
        id: i.id,
        platform: i.platform,
        isActive: i.is_active,
      }))}
    />
  );
}

export default async function ContentHistoryPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId } = await params;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ContentHistoryContent domainId={domainId} />
    </Suspense>
  );
}
