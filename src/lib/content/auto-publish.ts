import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdapter } from "@/lib/content/publishers";
import { logIntegrationBug } from "@/lib/content/integration-logger";

/**
 * Auto-publish an article to the domain's active integration (if one exists).
 * Returns the platform name if published, or null if skipped/failed.
 */
export async function autoPublishArticle(
  domainId: string,
  articleId: string
): Promise<string | null> {
  const { data: integration } = await supabaseAdmin
    .from("publish_integrations")
    .select("*")
    .eq("domain_id", domainId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!integration) return null;

  const adapter = getAdapter(integration.platform);
  if (!adapter) {
    console.warn(`[AutoPublish] No adapter for platform: ${integration.platform}`);
    return null;
  }

  const { data: article } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("id", articleId)
    .eq("domain_id", domainId)
    .maybeSingle();

  if (!article) {
    console.warn(`[AutoPublish] Article ${articleId} not found`);
    return null;
  }

  try {
    const result = await adapter.publish(
      {
        title: article.title,
        slug: article.slug,
        content: article.content || "",
        metaDescription: article.meta_description || undefined,
        coverImage: article.cover_image || undefined,
        tags: article.tags || [],
        faq: article.faq || [],
        status: "published",
      },
      integration.config as Record<string, unknown>
    );

    if (!result.success) {
      await logIntegrationBug({
        domainId,
        platform: integration.platform,
        action: "publish",
        errorMessage: result.error || "Auto-publish returned unsuccessful",
        errorDetails: { articleTitle: article.title, auto: true },
        articleId,
      });
      console.error(`[AutoPublish] Failed for ${integration.platform}: ${result.error}`);
      return null;
    }

    const publishedTo = [...(article.published_to || [])];
    publishedTo.push({
      platform: integration.platform,
      url: result.url || "",
      id: result.externalId || "",
    });

    await supabaseAdmin
      .from("articles")
      .update({
        published_to: publishedTo,
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", articleId);

    console.log(`[AutoPublish] Published article ${articleId} to ${integration.platform}`);
    return integration.platform;
  } catch (err) {
    const errMsg = (err as Error).message;
    await logIntegrationBug({
      domainId,
      platform: integration.platform,
      action: "publish",
      errorMessage: errMsg,
      errorDetails: { articleTitle: article.title, auto: true },
      articleId,
    });
    console.error(`[AutoPublish] Error for ${integration.platform}:`, errMsg);
    return null;
  }
}
