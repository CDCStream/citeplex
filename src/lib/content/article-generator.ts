import { callLLM } from "@/lib/llm/client";
import { safeJsonParse } from "./safe-json-parse";

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
  const parsed = safeJsonParse<ReturnType<typeof defaultResearch>>(text, "Research");
  return parsed ?? defaultResearch();
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
  console.log(`[Outline] Raw LLM response length: ${text.length} chars`);
  const parsed = safeJsonParse<OutlineSection[]>(text, "Outline", true);
  const sections = Array.isArray(parsed) ? parsed.filter(s => s?.heading && s?.level) : [];
  if (sections.length === 0) {
    throw new Error("Outline parsed but produced 0 valid sections");
  }
  console.log(`[Outline] Generated ${sections.length} sections: ${sections.map(s => s.heading).join(", ")}`);
  return sections;
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

// ---------------------------------------------------------------------------
// Section-by-section article writing
// ---------------------------------------------------------------------------

interface OutlineChunk {
  sections: OutlineSection[];
  chunkIndex: number;
  totalChunks: number;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Split the outline into balanced chunks of 2-3 H2s each.
 * Each H2 carries its child H3s with it.
 */
function splitOutlineIntoChunks(outline: OutlineSection[]): OutlineChunk[] {
  // Group by H2: each H2 starts a new group, H3s attach to the preceding H2
  const h2Groups: OutlineSection[][] = [];
  let current: OutlineSection[] = [];

  for (const s of outline) {
    if (s.level === 2 && current.length > 0) {
      h2Groups.push(current);
      current = [];
    }
    current.push(s);
  }
  if (current.length > 0) h2Groups.push(current);

  if (h2Groups.length === 0) return [];

  // Distribute groups into chunks of 2-3 H2s
  const CHUNK_SIZE = 2;
  const chunks: OutlineChunk[] = [];
  for (let i = 0; i < h2Groups.length; i += CHUNK_SIZE) {
    const slice = h2Groups.slice(i, i + CHUNK_SIZE);
    chunks.push({
      sections: slice.flat(),
      chunkIndex: chunks.length,
      totalChunks: 0, // filled below
      isFirst: i === 0,
      isLast: i + CHUNK_SIZE >= h2Groups.length,
    });
  }

  for (const c of chunks) c.totalChunks = chunks.length;
  return chunks;
}

function outlineToText(sections: OutlineSection[]): string {
  return sections
    .map((s) => `${"#".repeat(s.level)} ${s.heading}${s.points.length ? "\n" + s.points.map((p) => `- ${p}`).join("\n") : ""}`)
    .join("\n\n");
}

/**
 * Write one chunk of the article.
 */
async function writeSection(
  chunk: OutlineChunk,
  ctx: {
    title: string;
    keyword: string;
    brandName: string;
    brandUrl: string;
    language: string;
    voiceBlock: string;
    previousSummary: string;
    enhancementBlock: string;
    wordsPerChunk: number;
    currentYear: number;
    keywordContext: string;
    research: ResearchData;
  },
): Promise<string> {
  const chunkOutline = outlineToText(chunk.sections);

  const positionHint = chunk.isFirst
    ? "This is the OPENING of the article. Start with a compelling introduction paragraph before the first H2."
    : chunk.isLast
      ? "This is the CLOSING of the article. Wrap up with a strong conclusion."
      : `This is part ${chunk.chunkIndex + 1} of ${chunk.totalChunks}. Continue naturally from the previous section.`;

  const continuityBlock = ctx.previousSummary
    ? `\nPrevious sections summary (continue from here, do NOT repeat these points):\n${ctx.previousSummary}\n`
    : "";

  const system = `You are an expert SEO content writer. Write ONLY the sections specified below in HTML format.
IMPORTANT: Write in ${ctx.language}. Every sentence, heading, and paragraph must be in ${ctx.language}.
${ctx.voiceBlock}
Rules:
- Follow the outline structure exactly — write ONLY the sections listed below, nothing else
- Target ~${ctx.wordsPerChunk} words for this section
- Use the keyword "${ctx.keyword}" naturally (2-3% density)
- Mention "${ctx.brandName}" where relevant
- Use semantic HTML: <h2>, <h3>, <p>, <ul>, <ol>, <strong>, <em>, <blockquote>
- Include comparison/data tables where appropriate with class="comparison-table"
- Write engaging content optimized for humans and AI search engines
- Include E-E-A-T signals: statistics, expert insights, original data points
- Do NOT include <h1> — it is added separately
- Do NOT include markdown — HTML only
- Do NOT add meta/script tags — just the article HTML for these sections
${ctx.enhancementBlock}`;

  const user = `Article: "${ctx.title}"
Keyword: ${ctx.keyword}
Keyword Data: ${ctx.keywordContext || "N/A"}
Brand: ${ctx.brandName} (${ctx.brandUrl})
Year: ${ctx.currentYear}
Statistics: ${(ctx.research.statistics || []).join("; ") || "N/A"}
Sources: ${ctx.research.externalSources.join(", ") || "N/A"}

${positionHint}
${continuityBlock}
Sections to write:
${chunkOutline}

Write these sections now in ${ctx.language}. Output ONLY the HTML for these sections.`;

  return callLLM({
    chain: "strong",
    system,
    user,
    temperature: 0.7,
    maxTokens: 4096,
    timeout: 75_000,
  });
}

/**
 * Generate meta description, tags, and FAQ from the completed article.
 */
async function generateArticleMeta(
  title: string,
  keyword: string,
  contentSnippet: string,
  language: string,
  generateFaqs: boolean,
): Promise<{ metaDescription: string; tags: string[]; faq: { question: string; answer: string }[] }> {
  const faqInstruction = generateFaqs
    ? `"faq": [{"question":"real search query about ${keyword}","answer":"detailed answer"}] (4-6 items)`
    : `"faq": []`;

  const text = await callLLM({
    chain: "fast",
    system: `You are an SEO specialist. Generate article metadata. Return ONLY valid JSON, nothing else.`,
    user: `Article title: "${title}"
Keyword: "${keyword}"
Language: ${language}
Article excerpt (first 1500 chars): ${contentSnippet.slice(0, 1500)}

Return JSON:
{
  "metaDescription": "150-160 char meta description in ${language}",
  "tags": ["5-8 SEO tags in ${language}"],
  ${faqInstruction}
}`,
    temperature: 0.3,
    maxTokens: 1500,
    timeout: 30_000,
  });

  const parsed = safeJsonParse<{ metaDescription?: string; tags?: string[]; faq?: { question: string; answer: string }[] }>(text, "ArticleMeta");
  return {
    metaDescription: parsed?.metaDescription || "",
    tags: parsed?.tags || [],
    faq: parsed?.faq || [],
  };
}

/**
 * Summarize written sections for continuity context (keeps prompt small).
 */
function summarizeSections(html: string): string {
  const headings = html.match(/<h[23][^>]*>(.*?)<\/h[23]>/gi) || [];
  const cleaned = headings.map((h) => h.replace(/<[^>]+>/g, "").trim());
  if (cleaned.length === 0) return "";
  return `Sections written so far: ${cleaned.join(", ")}`;
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
  const voiceBlock = brandVoiceInstruction
    ? `\n${brandVoiceInstruction}\nIMPORTANT: Match this brand voice throughout.\n`
    : "";

  const currentYear = new Date().getFullYear();

  // --- Build per-chunk enhancement instructions ---
  const bodyEnhancements: string[] = [];
  const lastEnhancements: string[] = [];

  if (enhancements.expertQuotes) {
    bodyEnhancements.push(
      `- EXPERT QUOTES: Include 1-2 quotes from real industry experts. Format: <blockquote class="expert-quote"><p>"[quote]"</p><cite>— [Name], [Title]</cite></blockquote>`
    );
  }

  if (enhancements.keyTakeaways && enhancements.keyTakeawaysPlacement === "beginning") {
    bodyEnhancements.push(
      `- KEY TAKEAWAYS: Add a "Key Takeaways" box with 4-6 bullet points. Format: <div class="key-takeaways"><h3>Key Takeaways</h3><ul><li>...</li></ul></div>`
    );
  }

  if (enhancements.internalLinking && sitePages.length > 0) {
    const pageList = sitePages.slice(0, 10).map((p, i) => `  ${i + 1}. ${p.title} → ${p.url}`).join("\n");
    bodyEnhancements.push(`- INTERNAL LINKS: Add 1-2 links from:\n${pageList}`);
  }

  if (enhancements.externalLinks && sources.length > 0) {
    const sourceList = sources.slice(0, 5).map((s, i) => `  ${i + 1}. ${s.title} → ${s.url}`).join("\n");
    bodyEnhancements.push(`- CITATIONS: Cite sources inline as <sup><a href="[URL]" rel="noopener" target="_blank" class="citation">[n]</a></sup>.\n  Sources:\n${sourceList}`);
  }

  if (enhancements.callToAction && enhancements.callToAction.trim()) {
    lastEnhancements.push(
      `- CTA: Add <div class="cta-box"><h3>[Heading]</h3><p>[Text]</p><a href="${brandUrl}" class="cta-button">[Button]</a></div>`
    );
  }

  if (enhancements.keyTakeaways && enhancements.keyTakeawaysPlacement === "end") {
    lastEnhancements.push(
      `- KEY TAKEAWAYS: Add a "Key Takeaways" box with 4-6 bullet points. Format: <div class="key-takeaways"><h3>Key Takeaways</h3><ul><li>...</li></ul></div>`
    );
  }

  if (enhancements.externalLinks && sources.length > 0) {
    lastEnhancements.push(
      `- SOURCES SECTION: At the end add <div class="sources-section"><h2>Sources</h2><ol class="sources-list"><li><a href="[URL]" rel="noopener" target="_blank">[Title]</a></li></ol></div>`
    );
  }

  if (enhancements.generateFaqs) {
    lastEnhancements.push(
      `- FAQ (MANDATORY): End with <div class="faq-section"><h2>Frequently Asked Questions</h2><div class="faq-item"><h3>[Q]</h3><p>[A]</p></div></div> (4-6 questions about "${keyword}")`
    );
  }

  // --- Split outline into chunks ---
  const chunks = splitOutlineIntoChunks(outline);
  if (chunks.length === 0) {
    throw new Error("Outline produced no sections to write");
  }

  const wordsPerChunk = Math.round(wordCount / chunks.length);

  console.log(`[ArticleWriter] Writing "${title}" in ${chunks.length} chunks (~${wordsPerChunk} words each)`);

  // --- Write chunks sequentially (each builds on previous context) ---
  const htmlParts: string[] = [];
  let runningContext = "";

  for (const chunk of chunks) {
    const chunkEnhancementLines: string[] = [];

    // Body enhancements go to the first body chunk (index 1 or 0)
    if (chunk.chunkIndex === 0) {
      chunkEnhancementLines.push(...bodyEnhancements);
    }

    // Last-section enhancements go to the final chunk
    if (chunk.isLast) {
      chunkEnhancementLines.push(...lastEnhancements);
    }

    const enhBlock = chunkEnhancementLines.length > 0
      ? `\nENHANCEMENTS for this section:\n${chunkEnhancementLines.join("\n")}`
      : "";

    try {
      const chunkStart = Date.now();
      console.log(`[ArticleWriter] Starting chunk ${chunk.chunkIndex + 1}/${chunks.length} (sections: ${chunk.sections.map(s => s.heading).join(", ")})`);

      const html = await writeSection(chunk, {
        title,
        keyword,
        brandName,
        brandUrl,
        language,
        voiceBlock,
        previousSummary: runningContext,
        enhancementBlock: enhBlock,
        wordsPerChunk,
        currentYear,
        keywordContext,
        research,
      });

      htmlParts.push(html.trim());
      runningContext = summarizeSections(htmlParts.join("\n"));
      const elapsed = ((Date.now() - chunkStart) / 1000).toFixed(1);
      console.log(`[ArticleWriter] Chunk ${chunk.chunkIndex + 1}/${chunks.length} done in ${elapsed}s (${html.length} chars)`);
    } catch (err) {
      console.error(`[ArticleWriter] Chunk ${chunk.chunkIndex + 1} FAILED after ${((Date.now() - Date.now()) / 1000).toFixed(1)}s:`, (err as Error).message);
      if (chunk.isFirst && htmlParts.length === 0) throw err;
    }
  }

  const content = htmlParts.join("\n\n");

  if (!content.trim() || content.trim().length < 200) {
    throw new Error(`Article content too short or empty (${content.length} chars, ${htmlParts.length}/${chunks.length} chunks succeeded)`);
  }

  // --- Generate meta separately (fast, small call) ---
  console.log("[ArticleWriter] Generating meta...");
  const meta = await generateArticleMeta(title, keyword, content, language, enhancements.generateFaqs);

  const strippedText = content.replace(/<[^>]+>/g, " ");
  const actualWordCount = strippedText.split(/\s+/).filter((w) => w.length > 0).length;

  console.log(`[ArticleWriter] Done: ${actualWordCount} words, ${htmlParts.length}/${chunks.length} chunks`);

  return {
    content,
    metaDescription: meta.metaDescription,
    tags: meta.tags,
    faq: meta.faq,
    wordCount: actualWordCount,
  };
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
