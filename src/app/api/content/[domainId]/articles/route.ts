import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  researchTopic,
  generateOutline,
  writeArticle,
  checkSeo,
  DEFAULT_ENHANCEMENTS,
  type EnhancementOptions,
} from "@/lib/content/article-generator";
import { searchYouTubeVideos, buildVideoEmbedHtml } from "@/lib/content/youtube-search";
import { generateArticleImages } from "@/lib/content/image-generator";
import { buildVoiceInstruction, type BrandVoiceProfile } from "@/lib/content/brand-voice";
import { searchWebImages, searchInfographics, buildWebImageHtml } from "@/lib/content/web-image-search";
import { checkCoherence } from "@/lib/content/coherence-check";
import { factCheckAndCite } from "@/lib/content/fact-check";
import { insertInternalLinks } from "@/lib/content/internal-linker";
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
      console.error("[Articles] Unauthorized - no user session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainId } = await params;
    console.log(`[Articles] POST request. domainId=${domainId}, userId=${user.id}`);

    const { data: domain, error: domainError } = await supabaseAdmin
      .from("domains")
      .select("id, brand_name, url, description, industry, primary_country, brand_voice, user_id")
      .eq("id", domainId)
      .maybeSingle();

    if (domainError) {
      console.error(`[Articles] Supabase error fetching domain: ${domainError.message}`);
    }

    if (!domain) {
      console.error(`[Articles] Domain ${domainId} not found. error=${domainError?.message || "none"}`);
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    if (domain.user_id !== user.id) {
      console.error(`[Articles] Unauthorized: domain.user_id=${domain.user_id}, request.user_id=${user.id}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
    const { title, keyword, wordCount = 1500, planId, topArticles, secondaryKeywords, outline: preBuiltOutline, customOutline, enhancements: enhOpts } = body;
    const enhancements: EnhancementOptions = { ...DEFAULT_ENHANCEMENTS, ...(enhOpts || {}) };

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

    // Step 1: Research (with keyword data + top articles for gap analysis)
    const research = await researchTopic(
      title,
      targetKeyword,
      domain.brand_name,
      domain.industry || "",
      language,
      topArticles,
    );

    // Step 2: Use pre-built outline or generate one
    let outline;
    if (preBuiltOutline && Array.isArray(preBuiltOutline) && preBuiltOutline.length > 0) {
      outline = preBuiltOutline;
    } else if (customOutline && typeof customOutline === "string") {
      outline = parseCustomOutline(customOutline);
    } else {
      outline = await generateOutline(title, targetKeyword, research, wordCount, language);
    }

    // Step 3: Write article (with keyword data + brand voice + secondary keywords)
    const voiceInstruction = domain.brand_voice
      ? buildVoiceInstruction(domain.brand_voice as BrandVoiceProfile)
      : "";

    const secondaryKwContext = secondaryKeywords?.length
      ? `\n\nSecondary keywords to naturally incorporate: ${(secondaryKeywords as string[]).join(", ")}`
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
      keywordContext + secondaryKwContext,
      voiceInstruction,
      enhancements
    );

    // Step 4: YouTube videos, AI images, web images & infographics (parallel, conditional)
    const mediaPromises: [
      Promise<Awaited<ReturnType<typeof searchYouTubeVideos>>>,
      Promise<Awaited<ReturnType<typeof generateArticleImages>>>,
      Promise<Awaited<ReturnType<typeof searchWebImages>>>,
      Promise<Awaited<ReturnType<typeof searchInfographics>>>,
    ] = [
      enhancements.youtubeVideos ? searchYouTubeVideos(targetKeyword, 2) : Promise.resolve([]),
      enhancements.includeImages ? generateArticleImages(title, targetKeyword, 3) : Promise.resolve([]),
      enhancements.webImages ? searchWebImages(targetKeyword, 2) : Promise.resolve([]),
      enhancements.webImages ? searchInfographics(targetKeyword, 2) : Promise.resolve([]),
    ];
    const [videos, images, webImgs, infographics] = await Promise.allSettled(mediaPromises);

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

    // Step 4b: Web images & infographics from Google
    const webImageResults = webImgs.status === "fulfilled" ? webImgs.value : [];
    const infographicResults = infographics.status === "fulfilled" ? infographics.value : [];
    const allWebImages = [...webImageResults, ...infographicResults];

    if (allWebImages.length > 0) {
      const sections = enrichedContent.split("</h2>");
      const insertEvery = Math.max(1, Math.floor(sections.length / (allWebImages.length + 1)));
      for (let i = 0; i < allWebImages.length; i++) {
        const insertAt = insertEvery * (i + 1);
        if (insertAt < sections.length) {
          sections[insertAt] = `</h2>${buildWebImageHtml(allWebImages[i])}${sections[insertAt]}`;
        }
      }
      enrichedContent = sections.join("</h2>");
    }

    // Step 5: Coherence check
    const coherence = await checkCoherence(title, targetKeyword, enrichedContent, language);
    if (coherence.fixedContent) {
      enrichedContent = coherence.fixedContent;
    }

    // Step 6: Fact-check & citations
    const factCheck = await factCheckAndCite(enrichedContent, targetKeyword, language);
    if (factCheck.fixedContent) {
      enrichedContent = factCheck.fixedContent;
      console.log(`[Article] Fact-check: ${factCheck.claimsChecked} claims checked, ${factCheck.citationsAdded} citations added`);
    }

    // Step 7: Real internal linking
    if (enhancements.internalLinking) {
      const internalLinks = await insertInternalLinks(enrichedContent, domain.url, targetKeyword, language);
      if (internalLinks.fixedContent) {
        enrichedContent = internalLinks.fixedContent;
        console.log(`[Article] Internal links: ${internalLinks.pagesFound} pages found, ${internalLinks.linksInserted} links inserted`);
      }
    }

    // Step 8: SEO Check
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
        research_data: {
          ...research,
          videos: videoResults,
          images: imageResults,
          webImages: allWebImages,
          keywordMetrics: keywordMetrics ?? null,
          coherence: { score: coherence.score, issues: coherence.issues },
          factCheck: { claimsChecked: factCheck.claimsChecked, citationsAdded: factCheck.citationsAdded, issues: factCheck.issues },
        },
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

function parseCustomOutline(text: string): { heading: string; level: number; points: string[] }[] {
  const lines = text.split("\n").filter(l => l.trim());
  const sections: { heading: string; level: number; points: string[] }[] = [];
  let current: { heading: string; level: number; points: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const h2Match = trimmed.match(/^H2:\s*(.+)/i);
    const h3Match = trimmed.match(/^H3:\s*(.+)/i);

    if (h2Match) {
      if (current) sections.push(current);
      current = { heading: h2Match[1].trim(), level: 2, points: [] };
    } else if (h3Match) {
      if (current) sections.push(current);
      current = { heading: h3Match[1].trim(), level: 3, points: [] };
    } else if (trimmed.startsWith("-") && current) {
      current.points.push(trimmed.slice(1).trim());
    }
  }

  if (current) sections.push(current);
  return sections;
}
