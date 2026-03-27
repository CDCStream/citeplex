import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdapter } from "@/lib/content/publishers";

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ domainId: string; articleId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainId, articleId } = await params;
    const { platform } = await req.json();

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { data: article } = await supabaseAdmin
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .eq("domain_id", domainId)
      .maybeSingle();

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    const { data: integration } = await supabaseAdmin
      .from("publish_integrations")
      .select("*")
      .eq("domain_id", domainId)
      .eq("platform", platform)
      .eq("is_active", true)
      .maybeSingle();

    if (!integration) {
      return NextResponse.json(
        { error: `Integration not configured for ${platform}` },
        { status: 400 }
      );
    }

    const adapter = getAdapter(platform);
    if (!adapter) {
      return NextResponse.json(
        { error: "Unsupported platform" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: result.error || "Publishing failed" },
        { status: 500 }
      );
    }

    const publishedTo = [...(article.published_to || [])];
    publishedTo.push({
      platform,
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

    return NextResponse.json({ result });
  } catch (err) {
    console.error("Article publish error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to publish" },
      { status: 500 }
    );
  }
}
