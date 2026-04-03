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
import { searchRelevantSources } from "@/lib/content/source-search";

interface ArticlePreferences {
  includeCta?: boolean;
  includeFaq?: boolean;
}

export const maxDuration = 300;

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

  } catch { /* continue without media */ }

  const seo = checkSeo(plan.title, targetKeyword, enrichedContent, generated.metaDescription);

  const keywordSlug = targetKeyword
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u3000-\u9FFF]+/g, "-")
    .replace(/^-|-$/g, "");
  const titleSuffix = plan.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .filter(w => !keywordSlug.includes(w) && w.length > 2)
    .slice(0, 4)
    .join("-");
  const slug = titleSuffix ? `${keywordSlug}-${titleSuffix}` : keywordSlug;

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

const TIME_BUDGET_MS = 270_000;
const DOMAIN_CONCURRENCY = 3;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

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

    const domainPlanMap = new Map<string, string | null>();
    for (const row of users || []) {
      const plan = (row as unknown as { users: { plan: string | null } }).users?.plan ?? null;
      domainPlanMap.set(row.id, plan);
    }

    const plansByDomain = new Map<string, typeof todayPlans>();
    for (const plan of todayPlans) {
      const list = plansByDomain.get(plan.domain_id) || [];
      list.push(plan);
      plansByDomain.set(plan.domain_id, list);
    }

    const allResults: { planId: string; domain: string; status: string; articleId?: string }[] = [];

    async function processDomain(domainId: string) {
      const plans = plansByDomain.get(domainId) || [];
      const domain = domainMap.get(domainId);
      const domainResults: typeof allResults = [];

      if (!domain) {
        for (const p of plans) {
          domainResults.push({ planId: p.id, domain: domainId, status: "domain_not_found" });
        }
        return domainResults;
      }

      const userPlan = domainPlanMap.get(domainId) ?? null;
      const dailyLimit = getDailyArticleLimit(userPlan);
      if (dailyLimit === 0) {
        for (const p of plans) {
          domainResults.push({ planId: p.id, domain: domain.brand_name, status: "no_active_plan" });
        }
        return domainResults;
      }
      let written = 0;

      for (const plan of plans) {
        if (Date.now() - startTime > TIME_BUDGET_MS) {
          domainResults.push({ planId: plan.id, domain: domain.brand_name, status: "time_budget_reached" });
          continue;
        }

        if (written >= dailyLimit) {
          domainResults.push({ planId: plan.id, domain: domain.brand_name, status: "daily_limit_reached" });
          continue;
        }

      try {
        const articleId = await writeArticleForPlan(plan, domain);
        written++;
        domainResults.push({ planId: plan.id, domain: domain.brand_name, status: "ok", articleId });
      } catch (err) {
        console.error(`[DailyArticle] Error for plan ${plan.id}:`, err);
        await supabaseAdmin
          .from("content_plans")
          .update({ status: "planned", article_id: null })
          .eq("id", plan.id)
          .in("status", ["writing", "planned"]);
        domainResults.push({ planId: plan.id, domain: domain.brand_name, status: `error: ${(err as Error).message}` });
      }
      }

      return domainResults;
    }

    const domainIdList = [...plansByDomain.keys()];
    for (let i = 0; i < domainIdList.length; i += DOMAIN_CONCURRENCY) {
      if (Date.now() - startTime > TIME_BUDGET_MS) break;

      const chunk = domainIdList.slice(i, i + DOMAIN_CONCURRENCY);
      const settled = await Promise.allSettled(
        chunk.map((id) => processDomain(id))
      );

      for (const r of settled) {
        if (r.status === "fulfilled") {
          allResults.push(...r.value);
        }
      }
    }

    const replanPromises = domainIds.map((domainId) => {
      const userPlan = domainPlanMap.get(domainId) ?? null;
      if (!userPlan) return Promise.resolve();
      return checkAndReplan(domainId, userPlan).catch((err) =>
        console.error(`[DailyArticle] Replan error for ${domainId}:`, err)
      );
    });
    await Promise.allSettled(replanPromises);

    return NextResponse.json({
      success: true,
      written: allResults.filter((r) => r.status === "ok").length,
      elapsed_ms: Date.now() - startTime,
      results: allResults,
    });
  } catch (err) {
    console.error("Daily article cron error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
