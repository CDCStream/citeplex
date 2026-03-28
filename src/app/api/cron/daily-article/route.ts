import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { researchTopic, generateOutline, writeArticle, checkSeo } from "@/lib/content/article-generator";
import { fetchKeywordMetrics } from "@/lib/ahrefs/client";
import { buildVoiceInstruction, type BrandVoiceProfile } from "@/lib/content/brand-voice";
import { searchYouTubeVideos, buildVideoEmbedHtml } from "@/lib/content/youtube-search";
import { generateArticleImages } from "@/lib/content/image-generator";
import { searchWebImages, searchInfographics, buildWebImageHtml } from "@/lib/content/web-image-search";
import { checkCoherence } from "@/lib/content/coherence-check";
import { getLanguageName, getLanguageFromCountry } from "@/lib/languages";
import { checkAndReplan } from "@/lib/content/keyword-planner";
import { getDailyArticleLimit } from "@/lib/plans";

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

  let keywordContext = "";
  try {
    const metrics = await fetchKeywordMetrics([targetKeyword], countryCode);
    if (metrics[0]) {
      const m = metrics[0];
      keywordContext = `Ahrefs data for "${targetKeyword}": volume=${m.volume}, difficulty=${m.difficulty}/100, CPC=$${m.cpc}, traffic_potential=${m.traffic_potential}, parent_topic="${m.parent_topic || "N/A"}"`;
    }
  } catch { /* continue without ahrefs */ }

  const research = await researchTopic(plan.title, targetKeyword, domain.brand_name, domain.industry, languageName);
  const outline = await generateOutline(plan.title, targetKeyword, research, 1500, languageName);

  const voiceInstruction = domain.brand_voice ? buildVoiceInstruction(domain.brand_voice) : "";
  const article = await writeArticle(
    plan.title, targetKeyword, outline, research,
    domain.brand_name, domain.url, 1500,
    languageName, keywordContext, voiceInstruction
  );

  let enrichedContent = article.content;

  try {
    const [videos, images, webImages, infographics] = await Promise.all([
      searchYouTubeVideos(targetKeyword, 2).catch(() => []),
      generateArticleImages(plan.title, targetKeyword, 1).catch(() => []),
      searchWebImages(targetKeyword, 2).catch(() => []),
      searchInfographics(targetKeyword, 1).catch(() => []),
    ]);

    if (videos.length > 0) {
      const videoHtml = videos.map((v) => buildVideoEmbedHtml(v)).join("\n");
      const h2Match = enrichedContent.match(/<\/h2>/g);
      if (h2Match && h2Match.length >= 2) {
        let count = 0;
        enrichedContent = enrichedContent.replace(/<\/h2>/g, (match) => {
          count++;
          return count === 2 ? `${match}\n${videoHtml}` : match;
        });
      } else {
        enrichedContent += `\n${videoHtml}`;
      }
    }

    const allWebImages = [...webImages, ...infographics];
    if (allWebImages.length > 0) {
      const imgHtml = allWebImages.map((img) => buildWebImageHtml(img)).join("\n");
      enrichedContent += `\n${imgHtml}`;
    }

    if (images.length > 0) {
      const coverImage = images[0];
      enrichedContent = `<figure class="article-cover"><img src="${coverImage}" alt="${plan.title}" />\n</figure>\n${enrichedContent}`;
    }
  } catch { /* continue without media */ }

  const coherence = await checkCoherence(plan.title, targetKeyword, enrichedContent, languageName).catch(() => null);
  if (coherence?.fixedContent) {
    enrichedContent = coherence.fixedContent;
  }

  const seo = checkSeo(plan.title, targetKeyword, enrichedContent, article.metaDescription);

  const slug = plan.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

  const { data: savedArticle, error } = await supabaseAdmin
    .from("articles")
    .insert({
      domain_id: domain.id,
      content_plan_id: plan.id,
      title: plan.title,
      slug,
      meta_description: article.metaDescription,
      content: enrichedContent,
      word_count: enrichedContent.split(/\s+/).length,
      target_keyword: targetKeyword,
      tags: article.tags || [],
      outline: article.outline || [],
      research_data: { ...research, keywordContext },
      faq: article.faq || [],
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
      .select("id, domain_id, title, keyword")
      .eq("scheduled_date", today)
      .eq("status", "planned");

    if (!todayPlans?.length) {
      return NextResponse.json({ success: true, written: 0, message: "No articles scheduled for today" });
    }

    const domainIds = [...new Set(todayPlans.map((p) => p.domain_id))];

    const { data: domains } = await supabaseAdmin
      .from("domains")
      .select("id, brand_name, url, description, industry, primary_country, brand_voice")
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
