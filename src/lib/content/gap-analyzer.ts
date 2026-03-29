import { callLLM } from "@/lib/llm/client";
import { fetchKeywordMetrics, type AhrefsKeywordData } from "@/lib/ahrefs/client";
import { findAndScrapeTopArticles, type TopArticle } from "./top-articles";

export interface SecondaryKeyword {
  keyword: string;
  volume: number | null;
  difficulty: number | null;
}

export interface ArticleStructure {
  headings: number;
  wordCount: number;
  label: string;
}

export interface OutlineSection {
  heading: string;
  level: number;
  points: string[];
}

export interface GapAnalysis {
  targetKeyword: string;
  topic: string;
  title: string;
  keywordMetrics: AhrefsKeywordData | null;
  reasoning: string;
  topArticles: TopArticle[];
  secondaryKeywords: SecondaryKeyword[];
  recommendedStructure: ArticleStructure;
  structures: ArticleStructure[];
  outlines: OutlineSection[][];
}

const STRUCTURES: ArticleStructure[] = [
  { headings: 3, wordCount: 800, label: "2-3 headings (600-1000 words)" },
  { headings: 4, wordCount: 1250, label: "3-4 headings (1000-1500 words)" },
  { headings: 5, wordCount: 1750, label: "4-5 headings (1500-2000 words)" },
  { headings: 6, wordCount: 2250, label: "5-6 headings (2000-2500 words)" },
  { headings: 7, wordCount: 2750, label: "6-7 headings (2500-3000 words)" },
  { headings: 9, wordCount: 3500, label: "8-9 headings (3000-4000 words)" },
  { headings: 11, wordCount: 4500, label: "10-11 headings (4000-5000 words)" },
];

export async function analyzeGapAndPlan(
  prompt: string,
  brandName: string,
  brandUrl: string,
  industry: string,
  competitors: { name: string; url: string }[],
  country: string = "us",
): Promise<GapAnalysis> {

  const currentYear = new Date().getFullYear();

  const competitorContext = competitors.length > 0
    ? competitors.map(c => `- ${c.name} (${c.url})`).join("\n")
    : "(no competitors)";

  // Step 1: Generate candidate keywords with Opus
  const candidateResponse = await callLLM({
    chain: "strong",
    system: "You are an expert SEO strategist. Return ONLY valid JSON, nothing else.",
    user: `A brand is NOT being mentioned by ANY AI engine for this prompt:
"${prompt}"

Brand: ${brandName} (${brandUrl})
Industry: ${industry}
Country: ${country.toUpperCase()}
Competitors who ARE mentioned for this prompt:
${competitorContext}

Generate 15 candidate target keywords that could help this brand rank for this prompt.

IMPORTANT RULES for keyword generation:
- Include a MIX of keyword lengths: at least 5 short-tail (1-2 words), 5 medium-tail (2-3 words), and 5 long-tail (3-5 words)
- Short-tail keywords are critical because they have more Ahrefs data and higher search volumes
- Focus on POPULAR, commonly searched keywords — avoid overly niche or obscure terms
- Keywords that competitors likely use to get mentioned
- Include informational, commercial, and comparison intent variations
- Each keyword should be a realistic search query that real users would type

Return JSON:
{
  "candidates": [
    { "keyword": "...", "intent": "informational|commercial|comparison", "rationale": "..." }
  ]
}`,
    maxTokens: 2048,
    temperature: 0.7,
    timeout: 90000,
  });

  let candidates: { keyword: string; intent: string; rationale: string }[] = [];
  try {
    const parsed = JSON.parse(candidateResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    candidates = parsed.candidates || [];
  } catch {
    candidates = [{ keyword: prompt, intent: "informational", rationale: "fallback" }];
  }

  if (candidates.length === 0) {
    candidates = [{ keyword: prompt, intent: "informational", rationale: "fallback" }];
  }

  // Step 2: Fetch Ahrefs metrics for all candidates
  const keywords = candidates.map(c => c.keyword);
  let ahrefsData: AhrefsKeywordData[] = [];
  try {
    ahrefsData = await fetchKeywordMetrics(keywords, country);
  } catch (err) {
    console.error("[GapAnalyzer] Ahrefs fetch failed:", (err as Error).message);
  }

  const metricsMap = new Map(ahrefsData.map(d => [d.keyword.toLowerCase(), d]));

  const metricsTable = candidates.map(c => {
    const m = metricsMap.get(c.keyword.toLowerCase());
    return `- "${c.keyword}" | Intent: ${c.intent} | Volume: ${m?.volume ?? "N/A"} | KD: ${m?.difficulty ?? "N/A"} | CPC: $${m?.cpc ?? "N/A"} | Traffic Potential: ${m?.traffic_potential ?? "N/A"} | Parent Topic: ${m?.parent_topic ?? "N/A"}`;
  }).join("\n");

  // Step 3: Opus picks the best keyword and generates topic + title
  const finalResponse = await callLLM({
    chain: "strong",
    system: "You are an expert SEO strategist specializing in AI visibility and content gap analysis. Return ONLY valid JSON.",
    user: `Based on the Ahrefs data below, pick the BEST target keyword for writing a gap article.

## Original AI Prompt (brand is NOT mentioned here):
"${prompt}"

## Brand: ${brandName} (${brandUrl})
## Industry: ${industry}

## Candidate Keywords with Ahrefs Data:
${metricsTable}

## Selection Criteria (in order of priority):
1. MUST have actual Ahrefs data (Volume, KD) — NEVER pick a keyword where Volume AND KD are both "N/A"
2. Keyword Difficulty (KD) should be as LOW as possible (under 30 is ideal, under 50 is acceptable)
3. Search Volume should be as HIGH as possible (prefer keywords with volume > 100)
4. Traffic Potential matters more than raw volume
5. The keyword should be directly relevant to the original prompt
6. Prefer shorter, more popular keywords over obscure long-tail phrases
7. Prefer keywords that would naturally lead AI engines to mention the brand

## Your Task:
1. Pick the single best keyword
2. Define a content topic that comprehensively covers this keyword
3. Create an SEO-optimized article title (compelling, includes keyword naturally, 50-65 chars)

IMPORTANT: The current year is ${currentYear}. If you include a year in the title, use ${currentYear}. NEVER use outdated years like 2024 or 2025.

Return JSON:
{
  "targetKeyword": "the chosen keyword",
  "topic": "a clear topic description (1-2 sentences)",
  "title": "SEO-optimized article title",
  "reasoning": "why this keyword was chosen (mention KD, volume, relevance)"
}`,
    maxTokens: 1024,
    temperature: 0.5,
    timeout: 90000,
  });

  let result: { targetKeyword: string; topic: string; title: string; reasoning: string };
  try {
    result = JSON.parse(finalResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
  } catch {
    result = {
      targetKeyword: candidates[0].keyword,
      topic: `Comprehensive guide about ${candidates[0].keyword}`,
      title: `The Ultimate Guide to ${candidates[0].keyword}`,
      reasoning: "Fallback: LLM response could not be parsed",
    };
  }

  let chosenMetrics = metricsMap.get(result.targetKeyword.toLowerCase()) || null;

  // If the chosen keyword has no meaningful Ahrefs data, pick the best one that does
  const hasData = chosenMetrics && (chosenMetrics.volume !== null || chosenMetrics.difficulty !== null);
  if (!hasData && ahrefsData.length > 0) {
    const withData = ahrefsData
      .filter(d => d.volume !== null && d.volume > 0)
      .sort((a, b) => {
        const scoreA = (a.volume ?? 0) / Math.max(a.difficulty ?? 50, 1);
        const scoreB = (b.volume ?? 0) / Math.max(b.difficulty ?? 50, 1);
        return scoreB - scoreA;
      });

    if (withData.length > 0) {
      const better = withData[0];
      console.log(`[GapAnalyzer] Overriding keyword "${result.targetKeyword}" (N/A) → "${better.keyword}" (vol:${better.volume}, KD:${better.difficulty})`);
      result.targetKeyword = better.keyword;
      chosenMetrics = better;
      result.reasoning += ` (Auto-corrected: original keyword had no Ahrefs data, switched to "${better.keyword}" with volume ${better.volume})`;
    }
  }

  // Step 4: Find and scrape top 5 ranking articles for the chosen keyword
  let topArticles: TopArticle[] = [];
  try {
    topArticles = await findAndScrapeTopArticles(result.targetKeyword, 5);
    console.log(`[GapAnalyzer] Scraped ${topArticles.length} top articles for "${result.targetKeyword}"`);
  } catch (err) {
    console.error("[GapAnalyzer] Top articles scrape failed:", (err as Error).message);
  }

  // Step 5: Extract secondary keywords from top articles + validate with Ahrefs
  const secondaryKeywords = await extractSecondaryKeywords(
    result.targetKeyword,
    topArticles,
    country,
  );

  // Step 6: Determine recommended structure from top articles
  const { recommendedStructure, structures } = analyzeStructure(topArticles, secondaryKeywords.length);

  // Step 7: Generate 2 outline options
  const outlines = await generateOutlineOptions(
    result.title,
    result.targetKeyword,
    result.topic,
    secondaryKeywords,
    topArticles,
    recommendedStructure,
    industry,
    brandName,
  );

  return {
    targetKeyword: result.targetKeyword,
    topic: result.topic,
    title: result.title,
    keywordMetrics: chosenMetrics,
    reasoning: result.reasoning,
    topArticles,
    secondaryKeywords,
    recommendedStructure,
    structures,
    outlines,
  };
}

async function extractSecondaryKeywords(
  primaryKeyword: string,
  topArticles: TopArticle[],
  country: string,
): Promise<SecondaryKeyword[]> {
  if (topArticles.length === 0) return [];

  const articleSummaries = topArticles.map((a, i) =>
    `Article ${i + 1} (${a.domain}):\nHeadings: ${a.headings.join(" | ")}\nContent: ${a.content.slice(0, 2000)}`
  ).join("\n\n");

  try {
    const response = await callLLM({
      chain: "fast",
      system: "You are an SEO keyword researcher. Return ONLY valid JSON.",
      user: `Analyze these top-ranking articles for "${primaryKeyword}" and extract 15-20 secondary/LSI keywords that appear frequently across multiple articles.

${articleSummaries}

Rules:
- Do NOT include the primary keyword "${primaryKeyword}"
- Focus on semantically related terms, not just synonyms
- Include both short-tail and long-tail variations
- Prioritize keywords that appear in headings across multiple articles

Return JSON:
{ "keywords": ["keyword1", "keyword2", ...] }`,
      maxTokens: 1024,
      temperature: 0.3,
      timeout: 30000,
    });

    const parsed = JSON.parse(response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    const kwList: string[] = (parsed.keywords || []).slice(0, 20);

    if (kwList.length === 0) return [];

    let ahrefsData: AhrefsKeywordData[] = [];
    try {
      ahrefsData = await fetchKeywordMetrics(kwList, country);
    } catch {
      return kwList.map(kw => ({ keyword: kw, volume: null, difficulty: null }));
    }

    const validated: SecondaryKeyword[] = ahrefsData
      .map(d => ({ keyword: d.keyword, volume: d.volume, difficulty: d.difficulty }))
      .sort((a, b) => {
        const scoreA = (a.volume ?? 0) / Math.max(a.difficulty ?? 50, 1);
        const scoreB = (b.volume ?? 0) / Math.max(b.difficulty ?? 50, 1);
        return scoreB - scoreA;
      })
      .slice(0, 8);

    return validated;
  } catch (err) {
    console.error("[GapAnalyzer] Secondary keywords extraction failed:", (err as Error).message);
    return [];
  }
}

function analyzeStructure(
  topArticles: TopArticle[],
  secondaryKeywordCount: number = 0,
): {
  recommendedStructure: ArticleStructure;
  structures: ArticleStructure[];
} {
  let best = STRUCTURES[2]; // default: 1500-2000

  if (topArticles.length > 0) {
    const avgWordCount = Math.round(
      topArticles.reduce((sum, a) => sum + a.wordCount, 0) / topArticles.length
    );
    const avgHeadings = Math.round(
      topArticles.reduce((sum, a) => sum + a.headings.length, 0) / topArticles.length
    );

    for (const s of STRUCTURES) {
      if (s.wordCount >= avgWordCount * 0.8 && s.headings >= avgHeadings * 0.8) {
        best = s;
        break;
      }
    }

    // If competitors average more, bump up one level to outperform
    const bestIdx = STRUCTURES.indexOf(best);
    if (bestIdx < STRUCTURES.length - 1 && avgWordCount > best.wordCount) {
      best = STRUCTURES[bestIdx + 1];
    }
  }

  // Secondary keywords push toward longer articles
  // 5+ secondary keywords → at least 2000 words, 7+ → at least 2500
  if (secondaryKeywordCount >= 7) {
    const minIdx = STRUCTURES.findIndex(s => s.wordCount >= 2500);
    if (minIdx >= 0 && STRUCTURES.indexOf(best) < minIdx) best = STRUCTURES[minIdx];
  } else if (secondaryKeywordCount >= 5) {
    const minIdx = STRUCTURES.findIndex(s => s.wordCount >= 2000);
    if (minIdx >= 0 && STRUCTURES.indexOf(best) < minIdx) best = STRUCTURES[minIdx];
  } else if (secondaryKeywordCount >= 3) {
    const minIdx = STRUCTURES.findIndex(s => s.wordCount >= 1500);
    if (minIdx >= 0 && STRUCTURES.indexOf(best) < minIdx) best = STRUCTURES[minIdx];
  }

  console.log(`[GapAnalyzer] Structure: ${best.label} (secondaryKW=${secondaryKeywordCount}, topArticles=${topArticles.length})`);
  return { recommendedStructure: best, structures: STRUCTURES };
}

async function generateOutlineOptions(
  title: string,
  keyword: string,
  topic: string,
  secondaryKeywords: SecondaryKeyword[],
  topArticles: TopArticle[],
  structure: ArticleStructure,
  industry: string,
  brandName: string,
): Promise<OutlineSection[][]> {
  const secondaryKwList = secondaryKeywords.map(k => k.keyword).join(", ");

  const currentYear = new Date().getFullYear();

  // Build rich competitor context: headings + content excerpts
  let competitorContext = "";
  if (topArticles.length > 0) {
    competitorContext = topArticles.map((a, i) => {
      const headingsStr = a.headings.length > 0
        ? `Headings: ${a.headings.slice(0, 15).join(" | ")}`
        : "";
      const contentSnippet = a.content.length > 100
        ? `Content excerpt: ${a.content.slice(0, 1500)}`
        : "";
      return `### Article ${i + 1}: "${a.title}" (${a.domain}, ${a.wordCount} words)\n${headingsStr}\n${contentSnippet}`;
    }).join("\n\n");
  }

  const outlinePrompt = `Generate 2 different article outlines for:
Title: "${title}"
Primary Keyword: "${keyword}"
Topic: ${topic}
Brand: ${brandName}
Industry: ${industry}
Current Year: ${currentYear}
Secondary Keywords to incorporate: ${secondaryKwList || "none"}
Target: ~${structure.headings} H2 sections, ~${structure.wordCount} words total

${competitorContext ? `## Top Ranking Competitor Articles (study these carefully and outperform them):\n${competitorContext}` : ""}

## CRITICAL Rules:
- Study the competitor articles above carefully — use SPECIFIC names, tools, products, brands, and examples mentioned in them
- NEVER use generic placeholders like "Tool #1", "Tool #2", "Product A", "Solution B" — always use REAL names from the competitor articles or well-known industry examples
- Each outline should have a DIFFERENT angle/approach
- MANDATORY: Every H2 section MUST have at least 2 H3 sub-headings underneath it. H3 headings are critical for SEO and content depth.
- Each heading should have 2-4 bullet points describing what to cover
- Include FAQ section (4-6 questions) at the end — FAQ items should be H3 under an H2
- Naturally incorporate secondary keywords in headings where relevant
- If the topic involves comparing tools/products, name the ACTUAL top tools in the headings (e.g. "Surfer SEO vs Clearscope" not "Tool #1 vs Tool #2")
- Outline 1: Comprehensive/educational approach
- Outline 2: Practical/actionable approach

Return JSON:
{
  "outlines": [
    [
      {"heading": "Main Section Title", "level": 2, "points": ["...", "..."]},
      {"heading": "Sub Section Detail", "level": 3, "points": ["...", "..."]},
      {"heading": "Another Sub Detail", "level": 3, "points": ["...", "..."]},
      {"heading": "Next Main Section", "level": 2, "points": ["...", "..."]},
      {"heading": "Sub Topic Here", "level": 3, "points": ["...", "..."]}
    ],
    [...]
  ]
}`;

  try {
    const response = await callLLM({
      chain: "strong",
      system: "You are an expert content strategist. Return ONLY valid JSON.",
      user: outlinePrompt,
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 90000,
    });

    const parsed = JSON.parse(response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    const outlines = parsed.outlines || [];

    if (outlines.length >= 2) return outlines.slice(0, 2);
    if (outlines.length === 1) return [outlines[0], outlines[0]];
    return [[], []];
  } catch (err) {
    console.error("[GapAnalyzer] Outline generation failed:", (err as Error).message);
    return [[], []];
  }
}
