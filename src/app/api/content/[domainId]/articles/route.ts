import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  researchTopic,
  generateOutline,
  writeArticle,
  checkSeo,
} from "@/lib/content/article-generator";
import { getArticleLimit } from "@/lib/plans";

export const maxDuration = 300;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainId } = await params;

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id, brand_name, url, description, industry")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const limit = getArticleLimit(user.plan || "starter");
    const { count } = await supabaseAdmin
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("domain_id", domainId);

    if ((count || 0) >= limit) {
      return NextResponse.json(
        { error: `Article limit reached (${limit}). Upgrade your plan.` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { title, keyword, wordCount = 1500, planId } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const targetKeyword = keyword?.trim() || title;

    // Step 1: Research
    const research = await researchTopic(
      title,
      targetKeyword,
      domain.brand_name,
      domain.industry || ""
    );

    // Step 2: Outline
    const outline = await generateOutline(
      title,
      targetKeyword,
      research,
      wordCount
    );

    // Step 3: Write
    const generated = await writeArticle(
      title,
      targetKeyword,
      outline,
      research,
      domain.brand_name,
      domain.url,
      wordCount
    );

    // Step 4: SEO Check
    const seoCheck = checkSeo(
      title,
      targetKeyword,
      generated.content,
      generated.metaDescription
    );

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data: article, error } = await supabaseAdmin
      .from("articles")
      .insert({
        domain_id: domainId,
        content_plan_id: planId || null,
        title: title.trim(),
        slug,
        meta_description: generated.metaDescription,
        content: generated.content,
        word_count: generated.wordCount,
        target_keyword: targetKeyword,
        tags: generated.tags,
        outline: outline,
        research_data: research,
        faq: generated.faq,
        seo_score: seoCheck.score,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;

    if (planId) {
      await supabaseAdmin
        .from("content_plans")
        .update({ article_id: article.id, status: "writing" })
        .eq("id", planId);
    }

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        wordCount: generated.wordCount,
        seoScore: seoCheck.score,
      },
      seoCheck,
    });
  } catch (err) {
    console.error("Article generation error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to generate article" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainId } = await params;

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { data: articles } = await supabaseAdmin
      .from("articles")
      .select(
        "id, title, slug, meta_description, word_count, target_keyword, tags, seo_score, status, created_at, updated_at"
      )
      .eq("domain_id", domainId)
      .order("created_at", { ascending: false });

    return NextResponse.json({ articles: articles || [] });
  } catch (err) {
    console.error("Articles list error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to list articles" },
      { status: 500 }
    );
  }
}
