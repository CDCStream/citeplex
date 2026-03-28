const OPENAI_API_KEY = () => process.env.OPENAI_API_KEY || "";
const ANTHROPIC_API_KEY = () => process.env.ANTHROPIC_API_KEY || "";

interface CallLLMOptions {
  webSearch?: boolean;
}

async function callOpenAI(systemPrompt: string, userPrompt: string, options?: CallLLMOptions): Promise<string> {
  const body: Record<string, unknown> = {
    model: "gpt-4.1-mini",
    input: [
      { role: "developer", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  if (options?.webSearch) {
    body.tools = [{ type: "web_search_preview" }];
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY()}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (
    data.output
      ?.filter((item: { type: string }) => item.type === "message")
      .map((item: { content: { text: string }[] }) =>
        item.content?.map((c: { text: string }) => c.text).join("")
      )
      .join("\n") ?? ""
  );
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.map((c: { text: string }) => c.text).join("") ?? "";
}

async function callLLM(systemPrompt: string, userPrompt: string, options?: CallLLMOptions): Promise<string> {
  try {
    return await callOpenAI(systemPrompt, userPrompt, options);
  } catch (err) {
    console.error("[LLM] OpenAI failed, trying Claude fallback:", (err as Error).message);
    if (options?.webSearch) {
      return await callClaude(systemPrompt, userPrompt + "\n\n(Note: web search is not available, use your knowledge.)");
    }
    return await callClaude(systemPrompt, userPrompt);
  }
}

interface ScrapedMeta {
  title: string;
  description: string;
  ogSiteName: string;
  ogDescription: string;
  ogTitle: string;
  lang: string;
  headingText: string;
  bodyText: string;
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function extractBodyText(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;

  return body
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);
}

async function scrapeWebsite(url: string): Promise<ScrapedMeta> {
  const empty: ScrapedMeta = { title: "", description: "", ogSiteName: "", ogDescription: "", ogTitle: "", lang: "", headingText: "", bodyText: "" };

  const urls = [url];
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.startsWith("www.")) {
      urls.push(`${parsed.protocol}//www.${parsed.hostname}${parsed.pathname}`);
    } else {
      urls.push(`${parsed.protocol}//${parsed.hostname.replace(/^www\./, "")}${parsed.pathname}`);
    }
  } catch { /* ignore */ }

  for (const targetUrl of urls) {
    const ua = USER_AGENTS[0];
    try {
      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        console.log(`[Scrape] HTTP ${res.status} for ${targetUrl}`);
        continue;
      }

      const html = await res.text();
      if (!html || html.length < 100) {
        console.log(`[Scrape] Too short HTML for ${targetUrl}: ${html.length} bytes`);
        continue;
      }

      const full = html.slice(0, 80000);

      const match = (pattern: RegExp): string => {
        const m = full.match(pattern);
        return decodeHtmlEntities(m?.[1]?.trim() || "");
      };

      const title = match(/<title[^>]*>([^<]+)<\/title>/i);
      const description =
        match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
        match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
      const ogSiteName =
        match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i) ||
        match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i);
      const ogDescription =
        match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
        match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
      const ogTitle =
        match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
        match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
      const lang = match(/<html[^>]*lang=["']([^"']+)["']/i);

      const headings = full.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi) || [];
      const headingText = headings
        .slice(0, 5)
        .map((h) => h.replace(/<[^>]+>/g, "").trim())
        .filter(Boolean)
        .join(" | ")
        .slice(0, 500);

      const bodyText = extractBodyText(html);

      const result = {
        title,
        description: description.slice(0, 500),
        ogSiteName,
        ogDescription: ogDescription.slice(0, 500),
        ogTitle,
        lang,
        headingText,
        bodyText,
      };

      const hasAnything = title || description || ogSiteName || ogDescription || headingText || bodyText.length > 50;
      if (hasAnything) {
        console.log(`[Scrape] OK for ${targetUrl} — title="${title.slice(0, 60)}", og:site="${ogSiteName}", desc="${(description || ogDescription).slice(0, 60)}", bodyLen=${bodyText.length}, headings="${headingText.slice(0, 80)}"`);
        return result;
      }

      console.log(`[Scrape] No useful content from ${targetUrl}, htmlLen=${html.length}`);
    } catch (err) {
      console.error(`[Scrape] Fetch error for ${targetUrl}:`, (err as Error).message);
      continue;
    }
  }

  console.log(`[Scrape] All attempts failed for ${url}, returning empty`);
  return empty;
}

export interface WebsiteAnalysis {
  brandName: string;
  description: string;
  industry: string;
  primaryCountry: string;
}

function detectCountryFromTLD(url: string): string | null {
  const tldMap: Record<string, string> = {
    ".com.tr": "TR", ".tr": "TR",
    ".de": "DE", ".fr": "FR", ".es": "ES", ".it": "IT",
    ".pt": "PT", ".com.br": "BR", ".br": "BR",
    ".nl": "NL", ".jp": "JP", ".co.jp": "JP",
    ".kr": "KR", ".co.kr": "KR",
    ".cn": "CN", ".com.cn": "CN",
    ".in": "IN", ".co.in": "IN",
    ".com.au": "AU", ".au": "AU",
    ".ca": "CA", ".com.mx": "MX", ".mx": "MX",
    ".se": "SE", ".pl": "PL",
    ".ae": "AE", ".sa": "SA", ".com.sa": "SA",
    ".il": "IL", ".co.il": "IL",
    ".ru": "RU", ".co.uk": "GB", ".uk": "GB",
  };

  try {
    const hostname = new URL(url).hostname.toLowerCase();
    for (const [tld, code] of Object.entries(tldMap).sort((a, b) => b[0].length - a[0].length)) {
      if (hostname.endsWith(tld)) return code;
    }
  } catch { /* ignore */ }
  return null;
}

function extractBrandHint(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const name = hostname.split(".")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[./]/)[0];
  }
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  const tldCountry = detectCountryFromTLD(url);
  const brandHint = extractBrandHint(url);
  const meta = await scrapeWebsite(url);

  const hasMetaTags = !!(meta.title || meta.description || meta.ogDescription || meta.ogTitle);
  const hasBodyContent = meta.bodyText.length > 50;
  const hasHeadings = !!meta.headingText;

  console.log(`[Analyze] ${url} — hasMeta=${hasMetaTags}, hasBody=${hasBodyContent}, hasHeadings=${hasHeadings}, brandHint="${brandHint}"`);

  // STRATEGY 1: No content at all → use AI web search as last resort
  if (!hasMetaTags && !hasBodyContent && !hasHeadings) {
    console.log(`[Analyze] Using web search fallback for ${url}`);
    return analyzeWithWebSearch(url, brandHint, tldCountry);
  }

  // STRATEGY 2: Has meta tags → use them (best case)
  // STRATEGY 3: No meta tags but has body content → use body text
  const contentForAI = hasMetaTags
    ? `- Page title: "${meta.title}"
- Meta description: "${meta.description || meta.ogDescription}"
- OG site name: "${meta.ogSiteName}"
- OG title: "${meta.ogTitle}"
- Page language: "${meta.lang}"
- H1/H2 headings: "${meta.headingText}"`
    : `- Page title: "${meta.title || "(not found)"}"
- Page language: "${meta.lang || "(not found)"}"
- H1/H2 headings: "${meta.headingText || "(not found)"}"
- Page body text (first 2000 chars): "${meta.bodyText.slice(0, 2000)}"`;

  const systemPrompt = `You extract structured brand information from website data. Only use the data provided — do NOT invent, guess, or hallucinate any information. Always respond with valid JSON only, no markdown.`;
  const userPrompt = `URL: ${url}
Domain name: ${brandHint}

Here is the actual data scraped from this website:
${contentForAI}

Based ONLY on the data above, return a JSON object:
{
  "brandName": "the brand name (use og:site_name if available, otherwise extract from title or use '${brandHint}')",
  "description": "1-2 sentence description of what they offer, no brand name",
  "industry": "the industry category (e.g. SaaS, E-commerce, Marketing, Developer Tools, etc.)",
  "primaryCountry": "ISO 3166-1 alpha-2 country code based on the page language and content (e.g. US, TR, DE)"
}

RULES:
- For brandName: prefer og:site_name > og:title (first part before separator) > page title (first part before — or | or -) > domain name "${brandHint}". Do NOT invent a name.
- For description: rephrase the meta description. If empty, infer from headings and body text.
- For industry: infer from the description/title/body content.
- For primaryCountry: infer from page language "${meta.lang}" and content. Default to "${tldCountry || "US"}" if unclear.

Only return the JSON, nothing else.`;

  let response = "";
  try {
    response = await callLLM(systemPrompt, userPrompt);
  } catch (err) {
    console.error(`[Analyze] OpenAI call failed for ${url}:`, (err as Error).message);
    return buildFallback(meta, brandHint, tldCountry);
  }

  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const result = JSON.parse(cleaned);

    if (!result.brandName) {
      result.brandName = meta.ogSiteName || brandHint;
    }

    const hintLower = brandHint.toLowerCase();
    const resultLower = (result.brandName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (resultLower && !resultLower.includes(hintLower) && !hintLower.includes(resultLower)) {
      if (meta.ogSiteName) {
        result.brandName = meta.ogSiteName;
      } else {
        result.brandName = brandHint;
      }
    }

    if (!result.primaryCountry) {
      result.primaryCountry = tldCountry || "US";
    }
    if (!result.description) {
      result.description = meta.description || meta.ogDescription || "";
    }
    if (!result.industry) {
      result.industry = inferIndustry(
        (result.description || "") + " " + (meta.title || "") + " " + (meta.headingText || "")
      );
    }
    return result;
  } catch {
    console.error(`[Analyze] JSON parse failed for ${url}, raw: ${cleaned.slice(0, 200)}`);
    return buildFallback(meta, brandHint, tldCountry);
  }
}

function inferIndustry(text: string): string {
  const lower = text.toLowerCase();
  const rules: [RegExp, string][] = [
    [/\b(seo|search engine|ai visibility|ai engine|aeo|geo|serp|backlink|keyword|organic traffic)\b/, "SEO & AI Visibility"],
    [/\b(marketing|advertis|campaign|brand awareness|social media|content marketing)\b/, "Marketing"],
    [/\b(e-?commerce|online store|shopif|retail|product catalog|shopping)\b/, "E-commerce"],
    [/\b(saas|software as a service|cloud platform|web app|dashboard)\b/, "SaaS"],
    [/\b(fintech|payment|banking|financial|crypto|blockchain|trading)\b/, "Fintech"],
    [/\b(health|medical|clinic|patient|wellness|fitness|pharma)\b/, "Healthcare"],
    [/\b(educat|learn|course|school|university|lms|tutori)\b/, "Education"],
    [/\b(real estate|property|rent|mortgage|housing)\b/, "Real Estate"],
    [/\b(travel|hotel|booking|flight|tourism)\b/, "Travel & Hospitality"],
    [/\b(food|restaurant|delivery|recipe|meal)\b/, "Food & Beverage"],
    [/\b(developer|api|sdk|open.?source|devops|code|programm)\b/, "Developer Tools"],
    [/\b(design|ui\/ux|figma|creative|graphic)\b/, "Design"],
    [/\b(hr|recruit|hiring|talent|employee|workforce)\b/, "HR & Recruitment"],
    [/\b(crm|sales|lead|pipeline|customer relationship)\b/, "Sales & CRM"],
    [/\b(cyber.?security|security|auth|encrypt|privacy)\b/, "Cybersecurity"],
    [/\b(ai|artificial intelligence|machine learning|nlp|llm|gpt|deep learning)\b/, "AI & Machine Learning"],
    [/\b(analytics|data|insight|metric|dashboard|bi|reporting)\b/, "Analytics"],
    [/\b(logistics|shipping|supply chain|warehouse|fulfillment)\b/, "Logistics"],
    [/\b(media|news|publish|journalism|content)\b/, "Media & Publishing"],
    [/\b(gaming|game|esport|play)\b/, "Gaming"],
  ];

  for (const [pattern, industry] of rules) {
    if (pattern.test(lower)) return industry;
  }
  return "Technology";
}

function buildFallback(meta: ScrapedMeta, brandHint: string, tldCountry: string | null): WebsiteAnalysis {
  const brandName = meta.ogSiteName || meta.ogTitle?.split(/[—|·\-]/)[0]?.trim() || brandHint;
  const description = meta.description || meta.ogDescription || meta.headingText || "";
  const industry = inferIndustry(description + " " + (meta.title || "") + " " + (meta.headingText || ""));
  return {
    brandName,
    description,
    industry,
    primaryCountry: tldCountry || "US",
  };
}

async function analyzeWithWebSearch(
  url: string,
  brandHint: string,
  tldCountry: string | null
): Promise<WebsiteAnalysis> {
  try {
    const systemPrompt = `You research websites and extract brand information. Use web search to find information about the given URL. Always respond with valid JSON only, no markdown.`;
    const userPrompt = `I need information about this website: ${url}
Domain name hint: ${brandHint}

Search the web for this website and return a JSON object:
{
  "brandName": "the brand/company name",
  "description": "1-2 sentence description of what they offer",
  "industry": "industry category (e.g. SaaS, E-commerce, Marketing)",
  "primaryCountry": "ISO 3166-1 alpha-2 country code (e.g. US, TR, DE)"
}

RULES:
- Use real information found from web search
- If you cannot find info, use domain name "${brandHint}" as brandName and leave description/industry minimal
- Only return the JSON, nothing else.`;

    const response = await callLLM(systemPrompt, userPrompt, { webSearch: true });
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);

    if (!result.brandName) result.brandName = brandHint;
    if (!result.primaryCountry) result.primaryCountry = tldCountry || "US";

    return result;
  } catch {
    return {
      brandName: brandHint,
      description: "",
      industry: "",
      primaryCountry: tldCountry || "US",
    };
  }
}

export interface GeneratedPrompt {
  text: string;
  category: string;
  language?: string;
  country?: string;
}

export interface CountryInput {
  code: string;
  lang: string;
  langName: string;
}

async function generatePromptsForLanguage(
  brandName: string,
  description: string,
  industry: string,
  langName: string,
  lang: string,
  countryCode: string,
  count: number
): Promise<GeneratedPrompt[]> {
  const isEnglish = lang === "en";
  const languageInstruction = isEnglish
    ? "Write all prompts in English."
    : `Write ALL prompts in ${langName} (language code: ${lang}). Every prompt must be in ${langName}, not English.`;

  const systemPrompt = `You generate search prompts that real people would type into AI assistants (ChatGPT, Perplexity, Gemini, Claude, etc.) when looking for exactly the kind of product or service described below. ${languageInstruction} Always respond with valid JSON only, no markdown.`;
  const userPrompt = `Brand: ${brandName}
Description: ${description}
Industry: ${industry}

Generate ${count} search prompts in ${langName} that a potential customer would ask an AI assistant when looking for EXACTLY this type of product/service.

CRITICAL RULES:
- NEVER include the brand name "${brandName}" or any variation of it
- NEVER include the brand's domain/URL
- Every prompt MUST be directly relevant to what this brand offers: "${description}"
- A prompt is relevant ONLY if this brand could realistically be recommended as an answer
- Do NOT generate generic prompts about unrelated topics, even if they're in the same broad industry
- Think: "Would someone searching this prompt benefit from discovering this exact product/service?"
- ALL prompts MUST be written in ${langName}

PROMPT TYPES (include a mix):
- "Best [specific product/service type]" discovery queries
- "How to [solve a problem this brand solves]" queries
- "What is the best way to [achieve outcome this brand enables]" queries
- "[Specific problem] solution" queries
- "Alternatives to [competitor type]" or comparison queries (no brand names)
- "Tools for [specific use case]" queries

EXAMPLES OF GOOD vs BAD (for an SEO tool brand):
✓ "best tools to track AI search visibility" — directly relevant
✓ "how to get mentioned by ChatGPT" — relevant problem this brand solves
✗ "best project management software" — wrong category entirely
✗ "how to start a business" — too generic, not relevant

Return a JSON array:
[{"text": "the prompt text in ${langName}", "category": "best|howto|comparison|recommendation|problem"}]

Only return the JSON array, nothing else.`;

  const response = await callLLM(systemPrompt, userPrompt);
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const prompts = JSON.parse(cleaned);
    if (!Array.isArray(prompts)) return [];

    const brandLower = brandName.toLowerCase();
    const descWords = extractKeywords(description + " " + industry);

    const filtered = prompts
      .filter((p: GeneratedPrompt) => {
        const textLower = p.text?.toLowerCase() ?? "";
        if (!textLower || textLower.length < 10) return false;
        if (textLower.includes(brandLower)) return false;
        return true;
      })
      .map((p: GeneratedPrompt) => {
        const textLower = p.text.toLowerCase();
        const relevanceScore = descWords.filter((w) => textLower.includes(w)).length;
        return { ...p, language: lang, country: countryCode, _score: relevanceScore };
      })
      .sort((a: { _score: number }, b: { _score: number }) => b._score - a._score)
      .map(({ _score, ...rest }: { _score: number; text: string; category: string; language: string; country: string }) => rest);

    return filtered.slice(0, count);
  } catch {
    return [];
  }
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "as", "into", "that", "this", "it", "its", "they", "their", "your", "our", "we", "you", "can", "will", "has", "have", "had", "do", "does", "not", "no", "all", "more", "most", "very", "just", "also", "about", "than", "how", "what", "which", "who", "when", "where", "why"]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i);
}

export async function generatePrompts(
  brandName: string,
  description: string,
  industry: string,
  countries?: CountryInput[],
  maxPrompts?: number
): Promise<GeneratedPrompt[]> {
  const limit = maxPrompts ?? 10;

  if (!countries || countries.length === 0) {
    return generatePromptsForLanguage(brandName, description, industry, "English", "en", "US", Math.min(limit, 8));
  }

  const promptsPerCountry = Math.max(1, Math.floor(limit / countries.length));
  const allPrompts: GeneratedPrompt[] = [];

  const uniqueLangs = new Map<string, CountryInput[]>();
  for (const c of countries) {
    const existing = uniqueLangs.get(c.lang) || [];
    existing.push(c);
    uniqueLangs.set(c.lang, existing);
  }

  const results = await Promise.all(
    Array.from(uniqueLangs.entries()).map(async ([lang, countryGroup]) => {
      const first = countryGroup[0];
      const totalCount = promptsPerCountry * countryGroup.length;
      const prompts = await generatePromptsForLanguage(
        brandName, description, industry,
        first.langName, lang, first.code,
        totalCount
      );

      if (countryGroup.length === 1) {
        return prompts;
      }

      const perCountry = Math.ceil(prompts.length / countryGroup.length);
      const distributed: GeneratedPrompt[] = [];
      countryGroup.forEach((c, idx) => {
        const slice = prompts.slice(idx * perCountry, (idx + 1) * perCountry);
        distributed.push(...slice.map((p) => ({ ...p, country: c.code })));
      });
      return distributed;
    })
  );

  for (const r of results) {
    allPrompts.push(...r);
  }

  return allPrompts.slice(0, limit);
}

export interface FoundCompetitor {
  brandName: string;
  url: string;
}

export async function findCompetitors(
  brandName: string,
  description: string,
  industry: string
): Promise<FoundCompetitor[]> {
  const systemPrompt = `You identify competitors for brands. Use web search to find real, current competitors. Always respond with valid JSON only, no markdown.`;
  const userPrompt = `Brand: ${brandName}
Description: ${description}
Industry: ${industry}

Find 5 direct competitors for this brand. They should be real companies that offer similar products/services.

Return a JSON array:
[{"brandName": "Competitor Name", "url": "https://competitor.com"}]

Only return the JSON array, nothing else. Do NOT include ${brandName} in the list.`;

  const response = await callLLM(systemPrompt, userPrompt, { webSearch: true });
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const competitors = JSON.parse(cleaned);
    return Array.isArray(competitors) ? competitors.slice(0, 5) : [];
  } catch {
    return [];
  }
}
