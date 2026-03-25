const OPENAI_API_KEY = () => process.env.OPENAI_API_KEY || "";

interface CallOpenAIOptions {
  webSearch?: boolean;
}

async function callOpenAI(systemPrompt: string, userPrompt: string, options?: CallOpenAIOptions): Promise<string> {
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
    signal: AbortSignal.timeout(60000),
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

interface ScrapedMeta {
  title: string;
  description: string;
  ogSiteName: string;
  ogDescription: string;
  lang: string;
  headingText: string;
}

async function scrapeWebsite(url: string): Promise<ScrapedMeta> {
  const empty: ScrapedMeta = { title: "", description: "", ogSiteName: "", ogDescription: "", lang: "", headingText: "" };
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Citeplex/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return empty;

    const html = await res.text();
    const head = html.slice(0, 30000);

    const match = (pattern: RegExp): string => {
      const m = head.match(pattern);
      return m?.[1]?.trim() || "";
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
    const lang = match(/<html[^>]*lang=["']([^"']+)["']/i);

    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const headingText = h1Match?.[1]?.replace(/<[^>]+>/g, "").trim().slice(0, 200) || "";

    return { title, description: description.slice(0, 500), ogSiteName, ogDescription: ogDescription.slice(0, 500), lang, headingText };
  } catch {
    return empty;
  }
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

  const hasContent = !!(meta.title || meta.description || meta.ogDescription);

  if (!hasContent) {
    return {
      brandName: meta.ogSiteName || brandHint,
      description: "",
      industry: "",
      primaryCountry: tldCountry || "US",
    };
  }

  const systemPrompt = `You extract structured brand information from website metadata. Only use the data provided — do NOT invent, guess, or hallucinate any information. Always respond with valid JSON only, no markdown.`;
  const userPrompt = `URL: ${url}
Domain name: ${brandHint}

Here is the actual data scraped from this website:
- Page title: "${meta.title}"
- Meta description: "${meta.description || meta.ogDescription}"
- OG site name: "${meta.ogSiteName}"
- Page language: "${meta.lang}"
- H1 heading: "${meta.headingText}"

Based ONLY on the data above, return a JSON object:
{
  "brandName": "the brand name (use og:site_name if available, otherwise use '${brandHint}')",
  "description": "1-2 sentence description of what they offer based on the meta description, no brand name",
  "industry": "the industry category (e.g. SaaS, E-commerce, Marketing, Developer Tools, etc.)",
  "primaryCountry": "ISO 3166-1 alpha-2 country code based on the page language and content (e.g. US, TR, DE)"
}

RULES:
- For brandName: prefer og:site_name > page title > domain name "${brandHint}". Do NOT invent a name.
- For description: rephrase the meta description. If empty, write a short description based on the title.
- For industry: infer from the description/title.
- For primaryCountry: infer from page language "${meta.lang}" and content.

Only return the JSON, nothing else.`;

  const response = await callOpenAI(systemPrompt, userPrompt);
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const result = JSON.parse(cleaned);

    if (!result.brandName) {
      result.brandName = meta.ogSiteName || brandHint;
    }

    const hintLower = brandHint.toLowerCase();
    const resultLower = (result.brandName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (resultLower && !resultLower.includes(hintLower) && !hintLower.includes(resultLower)) {
      result.brandName = meta.ogSiteName || brandHint;
    }

    if (!result.primaryCountry && tldCountry) {
      result.primaryCountry = tldCountry;
    }
    if (!result.primaryCountry) {
      result.primaryCountry = "US";
    }
    return result;
  } catch {
    return {
      brandName: meta.ogSiteName || brandHint,
      description: meta.description || meta.ogDescription || "",
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

  const systemPrompt = `You generate generic search prompts that people would type into AI assistants (ChatGPT, Perplexity, etc.) when looking for products/services in a given category. ${languageInstruction} Always respond with valid JSON only, no markdown.`;
  const userPrompt = `Brand: ${brandName}
Description: ${description}
Industry: ${industry}

Generate ${count} GENERIC search prompts in ${langName} that potential customers would ask AI assistants when looking for this type of product/service.

CRITICAL RULES:
- NEVER include the brand name "${brandName}" or any variation of it in the prompts
- NEVER include the brand's domain/URL in the prompts
- Prompts must be generic category queries, NOT brand-specific
- Think about what a customer who doesn't know this brand yet would search for
- ALL prompts MUST be written in ${langName}

Include a mix of:
- "Best X" type queries
- "How to" queries
- Recommendation queries
- Problem-solving queries
- Comparison queries WITHOUT brand names

Return a JSON array:
[{"text": "the prompt text in ${langName}", "category": "best|howto|comparison|recommendation|problem"}]

Only return the JSON array, nothing else.`;

  const response = await callOpenAI(systemPrompt, userPrompt);
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const prompts = JSON.parse(cleaned);
    if (!Array.isArray(prompts)) return [];

    const brandLower = brandName.toLowerCase();
    const filtered = prompts
      .filter((p: GeneratedPrompt) => {
        const textLower = p.text?.toLowerCase() ?? "";
        return !textLower.includes(brandLower);
      })
      .map((p: GeneratedPrompt) => ({
        ...p,
        language: lang,
        country: countryCode,
      }));

    return filtered.slice(0, count);
  } catch {
    return [];
  }
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

  const response = await callOpenAI(systemPrompt, userPrompt, { webSearch: true });
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const competitors = JSON.parse(cleaned);
    return Array.isArray(competitors) ? competitors.slice(0, 5) : [];
  } catch {
    return [];
  }
}
