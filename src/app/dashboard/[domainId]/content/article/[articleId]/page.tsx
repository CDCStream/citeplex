import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ArticleEditor } from "@/components/dashboard/article-editor";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ domainId: string; articleId: string }>;
}) {
  const { domainId, articleId } = await params;

  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("id, brand_name, url")
    .eq("id", domainId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!domain) notFound();

  const { data: article } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("id", articleId)
    .eq("domain_id", domainId)
    .maybeSingle();

  if (!article) notFound();

  const { data: integrations } = await supabaseAdmin
    .from("publish_integrations")
    .select("*")
    .eq("domain_id", domainId)
    .eq("is_active", true);

  return (
    <ArticleEditor
      domainId={domainId}
      article={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        metaDescription: article.meta_description,
        coverImage: article.cover_image,
        content: article.content,
        wordCount: article.word_count,
        targetKeyword: article.target_keyword,
        secondaryKeywords: article.secondary_keywords,
        tags: article.tags,
        faq: article.faq,
        seoScore: article.seo_score,
        status: article.status,
        publishedTo: article.published_to,
        createdAt: article.created_at,
      }}
      integrations={(integrations || []).map((i) => ({
        id: i.id,
        platform: i.platform,
        isActive: i.is_active,
      }))}
    />
  );
}
