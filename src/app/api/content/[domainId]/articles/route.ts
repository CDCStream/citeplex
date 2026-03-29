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
import { discoverSitePages, type SitePage } from "@/lib/content/internal-linker";
import { fetchKeywordMetrics } from "@/lib/ahrefs/client";
import { getArticleLimit } from "@/lib/plans";
import { getLanguageName, getLanguageFromCountry } from "@/lib/languages";

export const maxDuration = 300;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domainId } = await params;

  const { data: domain, error: domainError } = await supabaseAdmin
    .from("domains")
    .select("*")
    .eq("id", domainId)
    .maybeSingle();

  if (domainError) {
    console.error(`[Articles] Supabase error: ${domainError.message}`);
  }
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }
  if (domain.user_id !== user.id) {
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
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const targetKeyword = keyword?.trim() || title;
        const countryCode = (domain.primary_country || "US").toLowerCase();
        const langCode = getLanguageFromCountry(domain.primary_country || "US");
        const language = getLanguageName(langCode);

        // Step 1: Research & Analysis
        send({ type: "step", step: "research", status: "active", message: "Analyzing keyword data..." });
        const [keywordMetrics] = await fetchKeywordMetrics([targetKeyword], countryCode);
        const keywordContext = keywordMetrics
          ? `Volume: ${keywordMetrics.volume ?? "N/A"}, Difficulty: ${keywordMetrics.difficulty ?? "N/A"}/100, CPC: $${keywordMetrics.cpc ?? "N/A"}, Traffic Potential: ${keywordMetrics.traffic_potential ?? "N/A"}, Parent Topic: ${keywordMetrics.parent_topic ?? "N/A"}`
          : "Keyword data unavailable";

        send({ type: "step", step: "research", status: "active", message: "Researching topic & competitors..." });

        const [research, sitePages, sources] = await Promise.all([
          researchTopic(title, targetKeyword, domain.brand_name, domain.industry || "", language, topArticles),
          enhancements.internalLinking ? discoverSitePages(domain.url) : Promise.resolve([] as SitePage[]),
          searchRelevantSources(targetKeyword),
        ]);
        send({ type: "step", step: "research", status: "done" });

        // Step 2: Building Outline
        send({ type: "step", step: "outline", status: "active", message: "Creating article outline..." });
        let outline;
        if (preBuiltOutline && Array.isArray(preBuiltOutline) && preBuiltOutline.length > 0) {
          outline = preBuiltOutline;
        } else if (customOutline && typeof customOutline === "string") {
          outline = parseCustomOutline(customOutline);
        } else {
          outline = await generateOutline(title, targetKeyword, research, wordCount, language);
        }
        send({ type: "step", step: "outline", status: "done" });

        // Step 3: Writing Content
        send({ type: "step", step: "writing", status: "active", message: "Writing article content..." });
        const voiceInstruction = domain.brand_voice
          ? buildVoiceInstruction(domain.brand_voice as BrandVoiceProfile)
          : "";
        const secondaryKwContext = secondaryKeywords?.length
          ? `\n\nSecondary keywords to naturally incorporate: ${(secondaryKeywords as string[]).join(", ")}`
          : "";

        const generated = await writeArticle(
          title, targetKeyword, outline, research, domain.brand_name, domain.url,
          wordCount, language, keywordContext + secondaryKwContext, voiceInstruction, enhancements,
          sitePages.map(p => ({ url: p.url, title: p.title })),
          sources,
        );
        send({ type: "step", step: "writing", status: "done" });
        send({ type: "preview", html: generated.content.slice(0, 2000) });

        // Step 4: Media & Images
        send({ type: "step", step: "media", status: "active", message: "Searching images & videos..." });
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
        send({ type: "step", step: "media", status: "done", mediaCount: videoResults.length + imageResults.length + allWebImages.length });

        // SEO score (local, no LLM)
        const seoCheck = checkSeo(title, targetKeyword, enrichedContent, generated.metaDescription);

        // Step 5: Saving
        send({ type: "step", step: "saving", status: "active", message: "Saving article..." });
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
              sitePages: sitePages.length,
              sourcesProvided: sources.length,
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

        send({
          type: "done",
          article: { id: article.id, title: article.title, slug: article.slug, wordCount: generated.wordCount },
        });
      } catch (err) {
        console.error("Article generation error:", err);
        send({ type: "error", message: (err as Error).message || "Failed to generate article" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
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
      .select("id, user_id")
      .eq("id", domainId)
      .maybeSingle();

    if (!domain || domain.user_id !== user.id) {
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

async function searchRelevantSources(keyword: string): Promise<{ title: string; url: string; domain: string }[]> {
  const serperKey = process.env.SERPER_API_KEY;
  if (!serperKey) return [];

  try {
    const queries = [
      `${keyword} statistics report ${new Date().getFullYear()}`,
      `${keyword} research study`,
    ];

    const results: { title: string; url: string; domain: string }[] = [];
    const seen = new Set<string>();

    for (const q of queries) {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q, num: 5 }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;

      const data = await res.json();
      for (const item of data.organic || []) {
        const host = new URL(item.link).hostname.toLowerCase();
        if (seen.has(host)) continue;
        seen.add(host);
        results.push({ title: item.title, url: item.link, domain: host });
      }
    }

    const authoritative = [
      ".edu", ".gov", ".org",
      "statista.com", "gartner.com", "mckinsey.com", "forrester.com",
      "hubspot.com", "semrush.com", "ahrefs.com", "moz.com",
      "searchengineland.com", "searchenginejournal.com",
      "techcrunch.com", "forbes.com", "bloomberg.com",
      "reuters.com", "google.com", "microsoft.com",
      "wikipedia.org", "nature.com",
    ];

    results.sort((a, b) => {
      const aAuth = authoritative.some(d => a.domain.includes(d)) ? 0 : 1;
      const bAuth = authoritative.some(d => b.domain.includes(d)) ? 0 : 1;
      return aAuth - bAuth;
    });

    return results.slice(0, 8);
  } catch {
    return [];
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
