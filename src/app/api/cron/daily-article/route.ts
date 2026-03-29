import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  researchTopic,
  generateOutline,
  writeArticle,
  checkSeo,
  DEFAULT_ENHANCEMENTS,
  type EnhancementOptions,
} from "@/lib/content/article-generator";
import { fetchKeywordMetrics } from "@/lib/ahrefs/client";
import { buildVoiceInstruction, type BrandVoiceProfile } from "@/lib/content/brand-voice";
import { searchYouTubeVideos, buildVideoEmbedHtml } from "@/lib/content/youtube-search";
import { generateArticleImages } from "@/lib/content/image-generator";
import { searchWebImages, searchInfographics, buildWebImageHtml } from "@/lib/content/web-image-search";
import { discoverSitePages, type SitePage } from "@/lib/content/internal-linker";
import { getLanguageName, getLanguageFromCountry } from "@/lib/languages";
import { checkAndReplan } from "@/lib/content/keyword-planner";
import { getDailyArticleLimit } from "@/lib/plans";

interface ArticlePreferences {
  includeCta?: boolean;
  includeFaq?: boolean;
}

export const maxDuration = 300;

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

async function writeArticleForPlan(
  plan: { id: string; title: string; keyword: string },
  domain: {
    id: string;
    brand_name: string;
    url: string;
    description: string;
    industry: string;
    primary_country: string;
    brand_voice: BrandVoiceProfile | null;
    article_preferences: ArticlePreferences | null;
  }
) {
  const targetKeyword = plan.keyword || plan.title;
  const countryCode = (domain.primary_country || "US").toLowerCase();
  const lang = getLanguageFromCountry(domain.primary_country || "US");
  const languageName = getLanguageName(lang);

  await supabaseAdmin
    .from("content_plans")
    .update({ status: "writing" })
    .eq("id", plan.id);

  // Fetch keyword metrics, research, site pages, and sources in parallel
  const keywordMetricsPromise = fetchKeywordMetrics([targetKeyword], countryCode).catch(() => []);
  const researchPromise = researchTopic(plan.title, targetKeyword, domain.brand_name, domain.industry || "", languageName);
  const sitePagesPromise = discoverSitePages(domain.url).catch(() => [] as SitePage[]);
  const sourcesPromise = searchRelevantSources(targetKeyword);

  const [metricsResult, research, sitePages, sources] = await Promise.all([
    keywordMetricsPromise,
    researchPromise,
    sitePagesPromise,
    sourcesPromise,
  ]);

  const keywordMetrics = metricsResult[0] || null;
  const keywordContext = keywordMetrics
    ? `Volume: ${keywordMetrics.volume ?? "N/A"}, Difficulty: ${keywordMetrics.difficulty ?? "N/A"}/100, CPC: $${keywordMetrics.cpc ?? "N/A"}, Traffic Potential: ${keywordMetrics.traffic_potential ?? "N/A"}, Parent Topic: ${keywordMetrics.parent_topic ?? "N/A"}`
    : "Keyword data unavailable";

  const outline = await generateOutline(plan.title, targetKeyword, research, 1500, languageName);

  const voiceInstruction = domain.brand_voice ? buildVoiceInstruction(domain.brand_voice) : "";

  const prefs = domain.article_preferences || { includeCta: true, includeFaq: true };
  const enhancements: EnhancementOptions = {
    ...DEFAULT_ENHANCEMENTS,
    callToAction: prefs.includeCta !== false ? "generic" : "",
    generateFaqs: prefs.includeFaq !== false,
  };

  const generated = await writeArticle(
    plan.title, targetKeyword, outline, research,
    domain.brand_name, domain.url, 1500,
    languageName, keywordContext, voiceInstruction, enhancements,
    sitePages.map(p => ({ url: p.url, title: p.title })),
    sources,
  );

  let enrichedContent = generated.content;
  let coverImage: string | null = null;

  // Media: same as manual flow
  try {
    const [videos, images, webImgs, infographics] = await Promise.allSettled([
      enhancements.youtubeVideos ? searchYouTubeVideos(targetKeyword, 2) : Promise.resolve([]),
      enhancements.includeImages ? generateArticleImages(plan.title, targetKeyword, 3) : Promise.resolve([]),
      enhancements.webImages ? searchWebImages(targetKeyword, 2) : Promise.resolve([]),
      enhancements.webImages ? searchInfographics(targetKeyword, 2) : Promise.resolve([]),
    ]);

    const videoResults = videos.status === "fulfilled" ? videos.value : [];
    if (videoResults.length > 0) {
      enrichedContent += buildVideoEmbedHtml(videoResults);
    }

    const imageResults = images.status === "fulfilled" ? images.value : [];
    coverImage = imageResults[0]?.url || null;
    if (imageResults.length > 1) {
      const inlineImages = imageResults.slice(1);
      const paragraphs = enrichedContent.split("</p>");
      const step = Math.max(1, Math.floor(paragraphs.length / (inlineImages.length + 1)));
      for (let i = 0; i < inlineImages.length; i++) {
        const insertAt = step * (i + 1);
        if (insertAt < paragraphs.length) {
          paragraphs[insertAt] = `</p><figure class="my-8"><img src="${inlineImages[i].url}" alt="${inlineImages[i].alt}" class="rounded-lg w-full" loading="lazy" /></figure>${paragraphs[insertAt]}`;
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

    if (coverImage) {
      enrichedContent = `<figure class="article-cover"><img src="${coverImage}" alt="${plan.title}" />\n</figure>\n${enrichedContent}`;
    }
  } catch { /* continue without media */ }

  const seo = checkSeo(plan.title, targetKeyword, enrichedContent, generated.metaDescription);

  const slug = plan.title
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u3000-\u9FFF]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: savedArticle, error } = await supabaseAdmin
    .from("articles")
    .insert({
      domain_id: domain.id,
      content_plan_id: plan.id,
      title: plan.title,
      slug,
      meta_description: generated.metaDescription,
      cover_image: coverImage,
      content: enrichedContent,
      word_count: generated.wordCount,
      target_keyword: targetKeyword,
      tags: generated.tags || [],
      outline: outline || [],
      research_data: {
        ...research,
        keywordMetrics,
        sitePages: sitePages.length,
        sourcesProvided: sources.length,
      },
      faq: generated.faq || [],
      seo_score: seo.score,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw error;

  await supabaseAdmin
    .from("content_plans")
    .update({
      status: "published",
      article_id: savedArticle.id,
    })
    .eq("id", plan.id);

  return savedArticle.id;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    const { data: todayPlans } = await supabaseAdmin
      .from("content_plans")
      .select("id, domain_id, title, keyword, article_id")
      .eq("scheduled_date", today)
      .eq("status", "planned")
      .is("article_id", null);

    if (!todayPlans?.length) {
      return NextResponse.json({ success: true, written: 0, message: "No articles scheduled for today" });
    }

    const domainIds = [...new Set(todayPlans.map((p) => p.domain_id))];

    const { data: domains } = await supabaseAdmin
      .from("domains")
      .select("id, brand_name, url, description, industry, primary_country, brand_voice, article_preferences")
      .in("id", domainIds);

    const domainMap = new Map((domains || []).map((d) => [d.id, d]));

    const { data: users } = await supabaseAdmin
      .from("domains")
      .select("id, user_id, users!inner(plan)")
      .in("id", domainIds);

    const domainPlanMap = new Map<string, string>();
    for (const row of users || []) {
      const plan = (row as unknown as { users: { plan: string } }).users?.plan || "starter";
      domainPlanMap.set(row.id, plan);
    }

    const domainArticleCounts = new Map<string, number>();

    const results: { planId: string; domain: string; status: string; articleId?: string }[] = [];

    for (const plan of todayPlans) {
      const domain = domainMap.get(plan.domain_id);
      if (!domain) {
        results.push({ planId: plan.id, domain: plan.domain_id, status: "domain_not_found" });
        continue;
      }

      const userPlan = domainPlanMap.get(plan.domain_id) || "starter";
      const dailyLimit = getDailyArticleLimit(userPlan);
      const written = domainArticleCounts.get(plan.domain_id) || 0;

      if (written >= dailyLimit) {
        results.push({ planId: plan.id, domain: domain.brand_name, status: "daily_limit_reached" });
        continue;
      }

      try {
        const articleId = await writeArticleForPlan(plan, domain);
        domainArticleCounts.set(plan.domain_id, written + 1);
        results.push({ planId: plan.id, domain: domain.brand_name, status: "ok", articleId });
      } catch (err) {
        console.error(`[DailyArticle] Error for plan ${plan.id}:`, err);
        results.push({ planId: plan.id, domain: domain.brand_name, status: `error: ${(err as Error).message}` });
      }
    }

    for (const domainId of domainIds) {
      try {
        await checkAndReplan(domainId);
      } catch (err) {
        console.error(`[DailyArticle] Replan error for ${domainId}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      written: results.filter((r) => r.status === "ok").length,
      results,
    });
  } catch (err) {
    console.error("Daily article cron error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
