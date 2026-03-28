import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  researchTopic,
  generateOutline,
  writeArticle,
  checkSeo,
} from "@/lib/content/article-generator";
import { searchYouTubeVideos, buildVideoEmbedHtml } from "@/lib/content/youtube-search";
import { generateArticleImages } from "@/lib/content/image-generator";
import { buildVoiceInstruction, type BrandVoiceProfile } from "@/lib/content/brand-voice";
import { fetchKeywordMetrics } from "@/lib/ahrefs/client";
import { getArticleLimit } from "@/lib/plans";
import { getLanguageName, getLanguageFromCountry } from "@/lib/languages";

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
      .select("id, brand_name, url, description, industry, primary_country, brand_voice")
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
    const countryCode = (domain.primary_country || "US").toLowerCase();
    const langCode = getLanguageFromCountry(domain.primary_country || "US");
    const language = getLanguageName(langCode);

    // Step 0: Ahrefs keyword research (mandatory)
    const [keywordMetrics] = await fetchKeywordMetrics([targetKeyword], countryCode);
    const keywordContext = keywordMetrics
      ? `Volume: ${keywordMetrics.volume ?? "N/A"}, Difficulty: ${keywordMetrics.difficulty ?? "N/A"}/100, CPC: $${keywordMetrics.cpc ?? "N/A"}, Traffic Potential: ${keywordMetrics.traffic_potential ?? "N/A"}, Parent Topic: ${keywordMetrics.parent_topic ?? "N/A"}`
      : "Keyword data unavailable";

    // Step 1: Research (with keyword data)
    const research = await researchTopic(
      title,
      targetKeyword,
      domain.brand_name,
      domain.industry || "",
      language
    );

    // Step 2: Outline (with keyword data)
    const outline = await generateOutline(
      title,
      targetKeyword,
      research,
      wordCount,
      language
    );

    // Step 3: Write article (with keyword data + brand voice)
    const voiceInstruction = domain.brand_voice
      ? buildVoiceInstruction(domain.brand_voice as BrandVoiceProfile)
      : "";

    const generated = await writeArticle(
      title,
      targetKeyword,
      outline,
      research,
      domain.brand_name,
      domain.url,
      wordCount,
      language,
      keywordContext,
      voiceInstruction
    );

    // Step 4: YouTube videos & AI images (parallel)
    const [videos, images] = await Promise.allSettled([
      searchYouTubeVideos(targetKeyword, 2),
      generateArticleImages(title, targetKeyword, 3),
    ]);

    let enrichedContent = generated.content;

    const videoResults = videos.status === "fulfilled" ? videos.value : [];
    if (videoResults.length > 0) {
      enrichedContent += buildVideoEmbedHtml(videoResults);
    }

    const imageResults = images.status === "fulfilled" ? images.value : [];
    const coverImage = imageResults[0]?.url || null;
    if (imageResults.length > 1) {
      const inlineImages = imageResults.slice(1);
      const paragraphs = enrichedContent.split("</p>");
      const step = Math.max(1, Math.floor(paragraphs.length / (inlineImages.length + 1)));
      for (let i = 0; i < inlineImages.length; i++) {
        const insertAt = step * (i + 1);
        if (insertAt < paragraphs.length) {
          paragraphs[insertAt] = `</p><figure class="my-8"><img src="${inlineImages[i].url}" alt="${inlineImages[i].alt}" class="rounded-lg w-full" loading="lazy" /><figcaption class="text-sm text-center text-muted-foreground mt-2">${inlineImages[i].alt}</figcaption></figure>${paragraphs[insertAt]}`;
        }
      }
      enrichedContent = paragraphs.join("</p>");
    }

    // Step 5: SEO Check
    const seoCheck = checkSeo(
      title,
      targetKeyword,
      enrichedContent,
      generated.metaDescription
    );

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u3000-\u9FFF]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data: article, error } = await supabaseAdmin
      .from("articles")
      .insert({
        domain_id: domainId,
        content_plan_id: planId || null,
        title: title.trim(),
        slug,
        meta_description: generated.metaDescription,
        cover_image: coverImage,
        content: enrichedContent,
        word_count: generated.wordCount,
        target_keyword: targetKeyword,
        tags: generated.tags,
        outline: outline,
        research_data: { ...research, videos: videoResults, images: imageResults, keywordMetrics: keywordMetrics ?? null },
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
