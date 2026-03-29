import { supabaseAdmin } from "@/lib/supabase/server";
import { fetchKeywordMetrics, type AhrefsKeywordData } from "@/lib/ahrefs/client";
import { callLLM } from "@/lib/llm/client";

interface DomainContext {
  id: string;
  brand_name: string;
  description: string;
  industry: string;
  primary_country: string;
  url: string;
}

interface PlannedKeyword {
  title: string;
  keyword: string;
  articleType: string;
  source: string;
  priority: number;
  keywordData: AhrefsKeywordData | null;
  reasoning: string;
}

async function getCompetitorKeywords(domainId: string, domain: DomainContext): Promise<string[]> {
  const { data: competitors } = await supabaseAdmin
    .from("competitors")
    .select("brand_name, url")
    .eq("domain_id", domainId)
    .limit(5);

  if (!competitors?.length) return [];

  const competitorNames = competitors.map((c) => `${c.brand_name} (${c.url})`).join(", ");

  const response = await callLLM({
    chain: "fast",
    system: "You are an SEO strategist. Generate keyword ideas based on competitor analysis. Return ONLY a JSON array of keyword strings.",
    user: `Our brand: ${domain.brand_name}
Description: ${domain.description}
Industry: ${domain.industry}
Competitors: ${competitorNames}

Generate 30 keyword ideas that our competitors likely rank for but we might not. Focus on:
1. Keywords where competitors have content but we don't
2. Long-tail variations of competitor topics
3. Comparison/alternative keywords (without brand names)
4. Problem-solving keywords in our shared industry

Return ONLY a JSON array of keyword strings, e.g. ["keyword 1", "keyword 2", ...]`,
    maxTokens: 8192,
    timeout: 120000,
  });

  try {
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

async function getBacklinkKeywords(domain: DomainContext): Promise<string[]> {
  const response = await callLLM({
    chain: "fast",
    system: "You are a link-building SEO strategist. Generate keywords for content that attracts backlinks. Return ONLY a JSON array of keyword strings.",
    user: `Brand: ${domain.brand_name}
Industry: ${domain.industry}
Description: ${domain.description}

Generate 15 keyword ideas for articles that would naturally attract backlinks:
1. "Statistics" or "data" keywords (e.g. "[industry] statistics 2025")
2. "Ultimate guide" keywords that become reference material
3. "How to" keywords with step-by-step value
4. "Best tools/resources" listicle keywords
5. "Benchmark/report" keywords that people cite

Return ONLY a JSON array of keyword strings.`,
    maxTokens: 8192,
    timeout: 120000,
  });

  try {
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

async function getOpportunityKeywords(domain: DomainContext): Promise<string[]> {
  const response = await callLLM({
    chain: "fast",
    system: "You are an SEO content strategist. Generate keyword ideas for organic traffic growth. Return ONLY a JSON array of keyword strings.",
    user: `Brand: ${domain.brand_name}
Industry: ${domain.industry}
Description: ${domain.description}
Country: ${domain.primary_country}

Generate 25 keyword ideas across these categories:
1. Bottom-of-funnel (buying intent) keywords - 5 keywords
2. Middle-of-funnel (consideration) keywords - 8 keywords
3. Top-of-funnel (awareness/educational) keywords - 7 keywords
4. Trending/emerging topics in this industry - 5 keywords

Focus on keywords that are:
- Realistic to rank for (not ultra-competitive head terms)
- Directly relevant to what this brand offers
- Likely to convert visitors into customers

Return ONLY a JSON array of keyword strings.`,
    maxTokens: 8192,
    timeout: 120000,
  });

  try {
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

function scoreKeyword(kw: AhrefsKeywordData, source: string): number {
  let score = 0;

  const hasVolume = kw.volume !== null && kw.volume > 0;
  const hasDifficulty = kw.difficulty !== null;

  if (hasVolume) {
    if (kw.volume! >= 1000) score += 30;
    else if (kw.volume! >= 300) score += 25;
    else if (kw.volume! >= 100) score += 20;
    else if (kw.volume! >= 30) score += 10;
  }

  if (hasDifficulty) {
    if (kw.difficulty! <= 20) score += 30;
    else if (kw.difficulty! <= 40) score += 20;
    else if (kw.difficulty! <= 60) score += 10;
  }

  // Bonus for having both vol + KD (complete data)
  if (hasVolume && hasDifficulty) score += 15;

  if (kw.traffic_potential !== null && kw.traffic_potential > 500) score += 10;
  if (kw.cpc !== null && kw.cpc > 1) score += 5;

  if (source === "competitor_gap") score += 10;
  if (source === "backlink_potential") score += 8;

  return Math.min(100, score);
}

async function generateTitlesForKeywords(
  keywords: { keyword: string; source: string; metrics: AhrefsKeywordData | null }[],
  domain: DomainContext,
  count: number
): Promise<PlannedKeyword[]> {
  const kwList = keywords
    .slice(0, count + 10)
    .map((k) => `- "${k.keyword}" (source: ${k.source}, volume: ${k.metrics?.volume ?? "?"}, difficulty: ${k.metrics?.difficulty ?? "?"})`)
    .join("\n");

  const response = await callLLM({
    chain: "fast",
    system: "You are an SEO content strategist. Create article titles for the given keywords. Return ONLY valid JSON.",
    user: `Brand: ${domain.brand_name}
Industry: ${domain.industry}
Description: ${domain.description}

Keywords to write articles for:
${kwList}

For each keyword, create an optimized article title and choose the best article type.

Return a JSON array:
[{
  "keyword": "the keyword",
  "title": "SEO-optimized article title (60-70 chars)",
  "articleType": "guide|how-to|listicle|comparison|explainer|round-up",
  "reasoning": "1 sentence why this keyword is valuable for this brand"
}]

Select the top ${count} keywords that would be most impactful. Return ONLY the JSON.`,
    maxTokens: 8192,
    timeout: 120000,
  });

  try {
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    const items = match ? JSON.parse(match[0]) : [];

    return items.slice(0, count).map((item: { keyword: string; title: string; articleType: string; reasoning: string }) => {
      const kwData = keywords.find((k) => k.keyword === item.keyword);
      return {
        title: item.title,
        keyword: item.keyword,
        articleType: item.articleType || "guide",
        source: kwData?.source || "opportunity",
        priority: kwData?.metrics ? scoreKeyword(kwData.metrics, kwData.source) : 50,
        keywordData: kwData?.metrics || null,
        reasoning: item.reasoning || "",
      };
    });
  } catch {
    return [];
  }
}

export async function planKeywords(
  domainId: string,
  days: number = 30
): Promise<{ planned: number; keywords: PlannedKeyword[] }> {
  await supabaseAdmin
    .from("domains")
    .update({ keyword_plan_status: "planning", keyword_plan_updated_at: new Date().toISOString() })
    .eq("id", domainId);

  try {
    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id, brand_name, description, industry, primary_country, url")
      .eq("id", domainId)
      .single();

    if (!domain) throw new Error("Domain not found");

    const { data: existingPlans } = await supabaseAdmin
      .from("content_plans")
      .select("keyword")
      .eq("domain_id", domainId)
      .gte("scheduled_date", new Date().toISOString().split("T")[0]);

    const existingKeywords = new Set(
      (existingPlans || []).map((p) => p.keyword?.toLowerCase()).filter(Boolean)
    );

    const [competitorKws, backlinkKws, opportunityKws] = await Promise.all([
      getCompetitorKeywords(domainId, domain),
      getBacklinkKeywords(domain),
      getOpportunityKeywords(domain),
    ]);

    const allKeywords = new Map<string, string>();
    for (const kw of competitorKws) {
      if (!existingKeywords.has(kw.toLowerCase())) allKeywords.set(kw, "competitor_gap");
    }
    for (const kw of backlinkKws) {
      if (!existingKeywords.has(kw.toLowerCase()) && !allKeywords.has(kw)) allKeywords.set(kw, "backlink_potential");
    }
    for (const kw of opportunityKws) {
      if (!existingKeywords.has(kw.toLowerCase()) && !allKeywords.has(kw)) allKeywords.set(kw, "ahrefs_opportunity");
    }

    const uniqueKeywords = Array.from(allKeywords.keys());
    const country = (domain.primary_country || "US").toLowerCase();

    let ahrefsData: AhrefsKeywordData[] = [];
    try {
      ahrefsData = await fetchKeywordMetrics(uniqueKeywords, country);
    } catch (err) {
      console.error("[KeywordPlanner] Ahrefs fetch failed:", (err as Error).message);
    }

    const metricsMap = new Map(ahrefsData.map((d) => [d.keyword, d]));

    const scoredKeywords = uniqueKeywords
      .map((kw) => ({
        keyword: kw,
        source: allKeywords.get(kw) || "opportunity",
        metrics: metricsMap.get(kw) || null,
        score: metricsMap.get(kw) ? scoreKeyword(metricsMap.get(kw)!, allKeywords.get(kw) || "opportunity") : 5,
      }))
      .sort((a, b) => b.score - a.score);

    const planned = await generateTitlesForKeywords(scoredKeywords, domain, days);

    const today = new Date();
    const rows = planned.map((kw, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i + 1);

      return {
        domain_id: domainId,
        title: kw.title,
        keyword: kw.keyword,
        article_type: kw.articleType,
        scheduled_date: date.toISOString().split("T")[0],
        status: "planned",
        source: kw.source,
        priority: kw.priority,
        keyword_data: {
          ...kw.keywordData,
          reasoning: kw.reasoning,
        },
      };
    });

    if (rows.length > 0) {
      const { error } = await supabaseAdmin.from("content_plans").insert(rows);
      if (error) console.error("[KeywordPlanner] Insert error:", error);
    }

    await supabaseAdmin
      .from("domains")
      .update({
        keyword_plan_status: "done",
        keyword_plan_updated_at: new Date().toISOString(),
      })
      .eq("id", domainId);

    return { planned: rows.length, keywords: planned };
  } catch (err) {
    console.error("[KeywordPlanner] Error:", err);
    await supabaseAdmin
      .from("domains")
      .update({ keyword_plan_status: "error" })
      .eq("id", domainId);
    throw err;
  }
}

export async function checkAndReplan(domainId: string): Promise<boolean> {
  const { data: futurePlans } = await supabaseAdmin
    .from("content_plans")
    .select("id", { count: "exact", head: true })
    .eq("domain_id", domainId)
    .eq("status", "planned")
    .gte("scheduled_date", new Date().toISOString().split("T")[0]);

  const remaining = futurePlans ?? 0;

  if (typeof remaining === "number" && remaining <= 5) {
    await planKeywords(domainId, 30);
    return true;
  }

  return false;
}
