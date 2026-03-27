const MODEL = "gpt-4o-mini";

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  return key;
}

async function chat(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.7,
  maxTokens = 4000
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export interface ResearchData {
  keyPoints: string[];
  competitors: string[];
  relatedTopics: string[];
  suggestedImages: string[];
  internalLinkSuggestions: string[];
  externalSources: string[];
}

export async function researchTopic(
  title: string,
  keyword: string,
  brandName: string,
  industry: string
): Promise<ResearchData> {
  const systemPrompt = `You are an SEO content researcher. Analyze the given topic and return ONLY valid JSON with this structure:
{
  "keyPoints": ["5-8 key points to cover"],
  "competitors": ["3-5 competitor articles on this topic"],
  "relatedTopics": ["5-8 related topics for internal linking"],
  "suggestedImages": ["3-5 suggested image descriptions"],
  "internalLinkSuggestions": ["3-5 internal link anchor text ideas"],
  "externalSources": ["3-5 authoritative external sources to cite"]
}`;

  const userPrompt = `Research this article topic:
Title: ${title}
Target Keyword: ${keyword}
Brand: ${brandName}
Industry: ${industry}`;

  const text = await chat(systemPrompt, userPrompt);
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
  wordCount: number
): Promise<OutlineSection[]> {
  const systemPrompt = `You are an SEO content strategist. Generate an article outline optimized for AI search engines.
Return ONLY valid JSON array: [{"heading":"...","level":2,"points":["key point 1","key point 2"]}]
- Include an introduction (H2), 4-8 main sections (H2/H3), and a conclusion (H2)
- Include an FAQ section at the end with 4-6 questions
- Optimize headings for the target keyword
- Target approximately ${wordCount} words total`;

  const userPrompt = `Title: ${title}
Target Keyword: ${keyword}
Key Points to Cover: ${research.keyPoints.join(", ")}
Related Topics: ${research.relatedTopics.join(", ")}`;

  const text = await chat(systemPrompt, userPrompt);
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

export interface GeneratedArticle {
  content: string;
  metaDescription: string;
  tags: string[];
  faq: { question: string; answer: string }[];
  wordCount: number;
}

export async function writeArticle(
  title: string,
  keyword: string,
  outline: OutlineSection[],
  research: ResearchData,
  brandName: string,
  brandUrl: string,
  wordCount: number
): Promise<GeneratedArticle> {
  const outlineText = outline
    .map(
      (s) =>
        `${"#".repeat(s.level)} ${s.heading}\n${s.points.map((p) => `- ${p}`).join("\n")}`
    )
    .join("\n\n");

  const systemPrompt = `You are an expert SEO content writer. Write a complete article in HTML format.

Requirements:
- Follow the provided outline structure exactly
- Target approximately ${wordCount} words
- Use the target keyword naturally (2-3% density)
- Include the brand name "${brandName}" naturally where relevant
- Add internal link placeholders as <a href="${brandUrl}/[page]">[anchor text]</a>
- Add external link placeholders as <a href="[url]" rel="noopener" target="_blank">[text]</a>
- Use semantic HTML: <h2>, <h3>, <p>, <ul>, <ol>, <strong>, <em>, <blockquote>
- Include a FAQ section at the end with proper HTML structure
- Write engaging, informative content optimized for both humans and AI search engines
- Do NOT include the <h1> title tag - it will be added separately
- Do NOT include any markdown - use only HTML

After the article HTML, add a JSON block wrapped in <script type="application/json" id="article-meta"> with:
{"metaDescription":"150-160 char meta description","tags":["5-8 tags"],"faq":[{"question":"...","answer":"..."}]}`;

  const userPrompt = `Title: ${title}
Target Keyword: ${keyword}
Brand: ${brandName} (${brandUrl})
External Sources: ${research.externalSources.join(", ")}
Image Suggestions: ${research.suggestedImages.join(", ")}

Outline:
${outlineText}

Write the complete article now.`;

  const text = await chat(systemPrompt, userPrompt, 0.7, 8000);

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
