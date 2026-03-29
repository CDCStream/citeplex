import { callLLM } from "@/lib/llm/client";

export interface ResearchData {
  keyPoints: string[];
  competitors: string[];
  relatedTopics: string[];
  suggestedImages: string[];
  internalLinkSuggestions: string[];
  externalSources: string[];
  backlinkAngles: string[];
  statistics: string[];
}

export interface TopArticleRef {
  title: string;
  url: string;
  domain: string;
  content: string;
  headings: string[];
  wordCount: number;
}

export async function researchTopic(
  title: string,
  keyword: string,
  brandName: string,
  industry: string,
  language = "English",
  topArticles?: TopArticleRef[],
): Promise<ResearchData> {
  const competitorInsight = topArticles?.length
    ? `\n\n## Top Ranking Articles for "${keyword}" (use these as reference to write a BETTER article):\n${topArticles.map((a, i) => `### ${i + 1}. ${a.title} (${a.domain}, ${a.wordCount} words)\nHeadings: ${a.headings.slice(0, 10).join(" | ")}\nContent excerpt: ${a.content.slice(0, 1500)}\n`).join("\n")}`
    : "";

  const systemPrompt = `You are an SEO content researcher. Analyze the given topic and return ONLY valid JSON with this structure:
{
  "keyPoints": ["5-8 key points to cover"],
  "competitors": ["3-5 competitor articles on this topic"],
  "relatedTopics": ["5-8 related topics for internal linking"],
  "suggestedImages": ["3-5 suggested image descriptions"],
  "internalLinkSuggestions": ["3-5 internal link anchor text ideas"],
  "externalSources": ["3-5 authoritative external sources to cite"],
  "backlinkAngles": ["3-5 unique data points, frameworks, or original insights that would make other sites want to link to this article"],
  "statistics": ["3-5 relevant industry statistics with source attribution to include in the article"]
}
All content must be in ${language}.${topArticles?.length ? "\nYou MUST analyze the top ranking articles provided and identify gaps, missing angles, and opportunities to create superior content." : ""}`;

  const userPrompt = `Research this article topic (write everything in ${language}):
Title: ${title}
Target Keyword: ${keyword}
Brand: ${brandName}
Industry: ${industry}${competitorInsight}`;

  const text = await callLLM({ chain: "strong", system: systemPrompt, user: userPrompt, temperature: 0.5, maxTokens: 2048 });
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return defaultResearch();

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return defaultResearch();
  }
}

function defaultResearch(): ResearchData {
  return {
    keyPoints: [],
    competitors: [],
    relatedTopics: [],
    suggestedImages: [],
    internalLinkSuggestions: [],
    externalSources: [],
    backlinkAngles: [],
    statistics: [],
  };
}

export interface OutlineSection {
  heading: string;
  level: number;
  points: string[];
}

export async function generateOutline(
  title: string,
  keyword: string,
  research: ResearchData,
  wordCount: number,
  language = "English"
): Promise<OutlineSection[]> {
  const systemPrompt = `You are an SEO content strategist. Generate an article outline optimized for AI search engines.
Return ONLY valid JSON array: [{"heading":"...","level":2,"points":["key point 1","key point 2"]}]
- Include an introduction (H2), 4-8 main sections (H2/H3), and a conclusion (H2)
- Include an FAQ section at the end with 4-6 questions
- Optimize headings for the target keyword
- Target approximately ${wordCount} words total
- All headings and points must be in ${language}`;

  const userPrompt = `Title: ${title}
Target Keyword: ${keyword}
Key Points to Cover: ${research.keyPoints.join(", ")}
Related Topics: ${research.relatedTopics.join(", ")}
Language: ${language}`;

  const text = await callLLM({ chain: "strong", system: systemPrompt, user: userPrompt, temperature: 0.5, maxTokens: 3000 });
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

export interface EnhancementOptions {
  expertQuotes: boolean;
  includeImages: boolean;
  internalLinking: boolean;
  externalLinks: boolean;
  callToAction: string;
  keyTakeaways: boolean;
  keyTakeawaysPlacement: "beginning" | "end";
  generateFaqs: boolean;
  youtubeVideos: boolean;
  webImages: boolean;
}

export const DEFAULT_ENHANCEMENTS: EnhancementOptions = {
  expertQuotes: true,
  includeImages: true,
  internalLinking: true,
  externalLinks: true,
  callToAction: "",
  keyTakeaways: true,
  keyTakeawaysPlacement: "beginning",
  generateFaqs: true,
  youtubeVideos: true,
  webImages: true,
};

export interface GeneratedArticle {
  content: string;
  metaDescription: string;
  tags: string[];
  faq: { question: string; answer: string }[];
  wordCount: number;
}

export interface SitePageRef {
  url: string;
  title: string;
}

export interface SourceRef {
  title: string;
  url: string;
  domain: string;
}

export async function writeArticle(
  title: string,
  keyword: string,
  outline: OutlineSection[],
  research: ResearchData,
  brandName: string,
  brandUrl: string,
  wordCount: number,
  language = "English",
  keywordContext = "",
  brandVoiceInstruction = "",
  enhancements: EnhancementOptions = DEFAULT_ENHANCEMENTS,
  sitePages: SitePageRef[] = [],
  sources: SourceRef[] = [],
): Promise<GeneratedArticle> {
  const outlineText = outline
    .map(
      (s) =>
        `${"#".repeat(s.level)} ${s.heading}\n${s.points.map((p) => `- ${p}`).join("\n")}`
    )
    .join("\n\n");

  const voiceBlock = brandVoiceInstruction
    ? `\n\n${brandVoiceInstruction}\nIMPORTANT: Match the brand voice described above throughout the entire article.\n`
    : "";

  const enhancementInstructions: string[] = [];

  if (enhancements.expertQuotes) {
    enhancementInstructions.push(
      `- EXPERT QUOTES: Include 2-3 relevant quotes from industry experts or thought leaders. Format as <blockquote class="expert-quote"><p>"[quote]"</p><cite>— [Expert Name], [Title/Company]</cite></blockquote>. Use real, well-known experts in the field when possible.`
    );
  }

  if (enhancements.keyTakeaways) {
    const placement = enhancements.keyTakeawaysPlacement === "beginning" ? "at the BEGINNING of the article (right after the introduction)" : "at the END of the article (before FAQ)";
    enhancementInstructions.push(
      `- KEY TAKEAWAYS: Add a "Key Takeaways" box ${placement} with 4-6 concise bullet points summarizing the most important insights. Format as: <div class="key-takeaways"><h3>Key Takeaways</h3><ul><li>...</li></ul></div>`
    );
  }

  if (enhancements.callToAction && enhancements.callToAction.trim()) {
    enhancementInstructions.push(
      `- CALL TO ACTION: Include a compelling call-to-action section near the end of the article (before FAQ). CTA instruction: "${enhancements.callToAction}". Format as: <div class="cta-box"><h3>[CTA Heading]</h3><p>[CTA Text]</p><a href="${brandUrl}" class="cta-button">[Button Text]</a></div>`
    );
  }

  if (enhancements.internalLinking && sitePages.length > 0) {
    const pageList = sitePages.slice(0, 20).map((p, i) => `  ${i + 1}. ${p.title} → ${p.url}`).join("\n");
    enhancementInstructions.push(
      `- INTERNAL LINKING: Add 3-5 internal links using ONLY the real site pages below. Use descriptive anchor text and distribute links naturally across different sections.\n  Available pages:\n${pageList}`
    );
  } else if (enhancements.internalLinking) {
    enhancementInstructions.push(
      `- INTERNAL LINKING: Add 3-5 internal link placeholders as <a href="${brandUrl}/[relevant-page]">[anchor text]</a> distributed naturally throughout the article.`
    );
  }

  if (enhancements.externalLinks && sources.length > 0) {
    const sourceList = sources.map((s, i) => `  ${i + 1}. ${s.title} → ${s.url}`).join("\n");
    enhancementInstructions.push(
      `- CITATIONS & EXTERNAL LINKS: Use these real, authoritative sources as citations throughout the article. For each statistic or factual claim, add an inline citation as <sup><a href="[URL]" rel="noopener" target="_blank" class="citation">[number]</a></sup>. At the end (before FAQ), add a "Sources" section listing all cited sources:\n  <div class="sources-section"><h2>Sources</h2><ol class="sources-list"><li><a href="[URL]" rel="noopener" target="_blank">[Source Title]</a></li></ol></div>\n  Available sources:\n${sourceList}`
    );
  } else if (enhancements.externalLinks) {
    enhancementInstructions.push(
      `- EXTERNAL LINKS: Add 3-5 external links to authoritative sources as <a href="[url]" rel="noopener" target="_blank">[text]</a>. Link to reputable industry sources, studies, or official documentation.`
    );
  }

  if (enhancements.generateFaqs) {
    enhancementInstructions.push(
      `- FAQ SECTION (MANDATORY): You MUST include a Frequently Asked Questions section as the LAST section of the article HTML. This is REQUIRED — do NOT skip it. Use this exact structure:
  <div class="faq-section">
    <h2>Frequently Asked Questions</h2>
    <div class="faq-item"><h3>[Question 1]</h3><p>[Detailed answer]</p></div>
    <div class="faq-item"><h3>[Question 2]</h3><p>[Detailed answer]</p></div>
    ... (4-6 questions total)
  </div>
  Questions should be real queries people search for about "${keyword}".`
    );
  }

  const enhancementBlock = enhancementInstructions.length > 0
    ? `\n\nENHANCEMENT REQUIREMENTS:\n${enhancementInstructions.join("\n")}`
    : "";

  const systemPrompt = `You are an expert SEO content writer. Write a complete article in HTML format.
IMPORTANT: Write the ENTIRE article in ${language}. Every sentence, heading, and paragraph must be in ${language}.
${voiceBlock}
Requirements:
- Follow the provided outline structure exactly
- Target approximately ${wordCount} words
- Use the target keyword naturally (2-3% density)
- Include the brand name "${brandName}" naturally where relevant
- Use semantic HTML: <h2>, <h3>, <p>, <ul>, <ol>, <strong>, <em>, <blockquote>
- Include HTML comparison/data tables where appropriate (e.g. feature comparisons, pros vs cons, pricing breakdowns, specifications). Use <table> with <thead> and <tbody>, styled with class="comparison-table" for styling hooks
- Write engaging, informative content optimized for both humans and AI search engines
- Maintain a coherent narrative throughout — every section must logically connect to the previous one and the overall topic. Do not drift off-topic or repeat the same points
- BACKLINK OPTIMIZATION — write content that other sites will want to link to:
  * Include original statistics, data points, or unique insights that others can cite
  * Create definitive, comprehensive sections that serve as single-source references
  * Add quotable statements and key takeaways that bloggers and journalists would reference
  * Build "linkable assets" within the article: comparison tables, step-by-step frameworks, checklists, or original definitions
  * Use the skyscraper approach: cover the topic more thoroughly than any existing article
  * Include expert-level analysis that demonstrates E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- Do NOT include the <h1> title tag - it will be added separately
- Do NOT include any markdown - use only HTML
${enhancementBlock}

After the article HTML, add a JSON block wrapped in <script type="application/json" id="article-meta"> with:
{"metaDescription":"150-160 char meta description in ${language}","tags":["5-8 tags in ${language}"],"faq":[{"question":"...","answer":"..."}]}`;

  const currentYear = new Date().getFullYear();

  const userPrompt = `Title: ${title}
Target Keyword: ${keyword}
Keyword Data (Ahrefs): ${keywordContext || "N/A"}
Brand: ${brandName} (${brandUrl})
External Sources: ${research.externalSources.join(", ")}
Image Suggestions: ${research.suggestedImages.join(", ")}
Backlink Angles: ${(research.backlinkAngles || []).join("; ") || "N/A"}
Statistics to Include: ${(research.statistics || []).join("; ") || "N/A"}
Current Year: ${currentYear} (use this year for any date references, NEVER use outdated years)
Language: ${language}

Outline:
${outlineText}

Write the complete article in ${language} now. Use the keyword data to optimize for search intent and competition level. Incorporate the backlink angles and statistics to make this article a link-worthy reference.`;

  const text = await callLLM({ chain: "strong", system: systemPrompt, user: userPrompt, temperature: 0.7, maxTokens: 8192, timeout: 180_000 });

  let content = text;
  let metaDescription = "";
  let tags: string[] = [];
  let faq: { question: string; answer: string }[] = [];

  const metaMatch = text.match(
    /<script[^>]*id="article-meta"[^>]*>([\s\S]*?)<\/script>/
  );
  if (metaMatch) {
    content = text.replace(metaMatch[0], "").trim();
    try {
      const meta = JSON.parse(metaMatch[1]);
      metaDescription = meta.metaDescription || "";
      tags = meta.tags || [];
      faq = meta.faq || [];
    } catch {
      // parse failed
    }
  }

  const strippedText = content.replace(/<[^>]+>/g, " ");
  const actualWordCount = strippedText
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return { content, metaDescription, tags, faq, wordCount: actualWordCount };
}

export interface SeoCheckResult {
  score: number;
  checks: {
    name: string;
    passed: boolean;
    message: string;
    impact: "high" | "medium" | "low";
  }[];
}

export function checkSeo(
  title: string,
  keyword: string,
  content: string,
  metaDescription: string
): SeoCheckResult {
  const checks: SeoCheckResult["checks"] = [];
  const lowerKeyword = keyword.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();
  const lowerMeta = (metaDescription || "").toLowerCase();

  const strippedText = content.replace(/<[^>]+>/g, " ");
  const words = strippedText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  checks.push({
    name: "Keyword in title",
    passed: lowerTitle.includes(lowerKeyword),
    message: lowerTitle.includes(lowerKeyword)
      ? "Target keyword appears in the title"
      : "Add the target keyword to the title",
    impact: "high",
  });

  checks.push({
    name: "Meta description",
    passed: metaDescription.length >= 120 && metaDescription.length <= 160,
    message:
      metaDescription.length >= 120 && metaDescription.length <= 160
        ? `Meta description is ${metaDescription.length} chars (optimal)`
        : `Meta description is ${metaDescription.length} chars (aim for 120-160)`,
    impact: "high",
  });

  checks.push({
    name: "Keyword in meta",
    passed: lowerMeta.includes(lowerKeyword),
    message: lowerMeta.includes(lowerKeyword)
      ? "Target keyword appears in meta description"
      : "Add the target keyword to meta description",
    impact: "medium",
  });

  const h2Matches = content.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const keywordInH2 = h2Matches.some((h) =>
    h.toLowerCase().includes(lowerKeyword)
  );
  checks.push({
    name: "Keyword in H2",
    passed: keywordInH2,
    message: keywordInH2
      ? "Target keyword appears in at least one H2"
      : "Add the target keyword to an H2 heading",
    impact: "medium",
  });

  checks.push({
    name: "Word count",
    passed: wordCount >= 800,
    message:
      wordCount >= 800
        ? `Article is ${wordCount} words (good length)`
        : `Article is ${wordCount} words (aim for 800+)`,
    impact: "high",
  });

  const keywordCount = (
    lowerContent.match(new RegExp(lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []
  ).length;
  const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
  checks.push({
    name: "Keyword density",
    passed: density >= 0.5 && density <= 3,
    message:
      density >= 0.5 && density <= 3
        ? `Keyword density is ${density.toFixed(1)}% (optimal)`
        : `Keyword density is ${density.toFixed(1)}% (aim for 0.5-3%)`,
    impact: "medium",
  });

  const internalLinks = (content.match(/<a[^>]*href="(?!http)[^"]*"[^>]*>/gi) || []).length;
  checks.push({
    name: "Internal links",
    passed: internalLinks >= 2,
    message:
      internalLinks >= 2
        ? `${internalLinks} internal links found`
        : `Only ${internalLinks} internal links (add at least 2)`,
    impact: "medium",
  });

  const externalLinks = (
    content.match(/<a[^>]*href="https?:\/\/[^"]*"[^>]*target="_blank"[^>]*>/gi) || []
  ).length;
  checks.push({
    name: "External links",
    passed: externalLinks >= 1,
    message:
      externalLinks >= 1
        ? `${externalLinks} external links found`
        : "Add at least 1 external link to authoritative sources",
    impact: "low",
  });

  const images = (content.match(/<img[^>]*>/gi) || []).length;
  checks.push({
    name: "Images",
    passed: images >= 1,
    message:
      images >= 1
        ? `${images} image(s) found`
        : "Add at least 1 image to the article",
    impact: "low",
  });

  const hasFaq = lowerContent.includes("faq") || lowerContent.includes("frequently asked");
  checks.push({
    name: "FAQ section",
    passed: hasFaq,
    message: hasFaq
      ? "FAQ section found"
      : "Add a FAQ section for rich results",
    impact: "medium",
  });

  const hasTables = (content.match(/<table[^>]*>/gi) || []).length;
  checks.push({
    name: "Comparison tables",
    passed: hasTables >= 1,
    message:
      hasTables >= 1
        ? `${hasTables} table(s) found`
        : "Consider adding a comparison or data table",
    impact: "low",
  });

  const passed = checks.filter((c) => c.passed).length;
  const weights = { high: 15, medium: 10, low: 5 };
  const maxScore = checks.reduce((s, c) => s + weights[c.impact], 0);
  const actualScore = checks.reduce(
    (s, c) => s + (c.passed ? weights[c.impact] : 0),
    0
  );
  const score = Math.round((actualScore / maxScore) * 100);

  return { score, checks };
}
