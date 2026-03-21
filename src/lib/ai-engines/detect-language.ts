const LANG_TO_COUNTRY: Record<string, string> = {
  en: "US", tr: "TR", de: "DE", fr: "FR", es: "ES", pt: "BR", it: "IT",
  nl: "NL", pl: "PL", ru: "RU", ja: "JP", ko: "KR", zh: "CN", ar: "SA",
  hi: "IN", sv: "SE", no: "NO", da: "DK", fi: "FI", cs: "CZ", ro: "RO",
  hu: "HU", el: "GR", uk: "UA", th: "TH", vi: "VN", id: "ID", ms: "MY",
  he: "IL", fa: "IR", bn: "BD", ta: "IN", ur: "PK", bg: "BG", hr: "HR",
  sk: "SK", sl: "SI", lt: "LT", lv: "LV", et: "EE", sr: "RS", mk: "MK",
  sq: "AL", bs: "BA", ka: "GE", az: "AZ", hy: "AM", sw: "KE", af: "ZA",
};

export interface PromptAnalysis {
  language: string;
  country: string;
  category: string;
}

const DETECT_PROMPT = (text: string) =>
  `Analyze this prompt/question and respond with ONLY a JSON object (no markdown, no explanation):
{"lang":"xx","cat":"category"}

lang = ISO 639-1 language code (e.g. "en", "tr", "de", "fr", "es", "ja")
cat = one of: "best", "how-to", "comparison", "recommendation", "review", "alternative", "pricing", "tutorial", "general"

Text: "${text}"`;

interface ProviderConfig {
  url: string;
  keyEnv: string;
  headers: (key: string) => Record<string, string>;
  body: (prompt: string) => object;
  extract: (data: unknown) => string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    url: "https://api.mistral.ai/v1/chat/completions",
    keyEnv: "MISTRAL_API_KEY",
    headers: (key) => ({ "Content-Type": "application/json", Authorization: `Bearer ${key}` }),
    body: (prompt) => ({ model: "mistral-small-latest", messages: [{ role: "user", content: prompt }], max_tokens: 30, temperature: 0 }),
    extract: (data: any) => data.choices?.[0]?.message?.content ?? "",
  },
  {
    url: "https://api.openai.com/v1/chat/completions",
    keyEnv: "OPENAI_API_KEY",
    headers: (key) => ({ "Content-Type": "application/json", Authorization: `Bearer ${key}` }),
    body: (prompt) => ({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 30, temperature: 0 }),
    extract: (data: any) => data.choices?.[0]?.message?.content ?? "",
  },
  {
    url: "https://api.anthropic.com/v1/messages",
    keyEnv: "ANTHROPIC_API_KEY",
    headers: (key) => ({ "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }),
    body: (prompt) => ({ model: "claude-haiku-4-5-20251001", max_tokens: 30, messages: [{ role: "user", content: prompt }] }),
    extract: (data: any) => data.content?.find((b: any) => b.type === "text")?.text ?? "",
  },
];

const VALID_CATEGORIES = ["best", "how-to", "comparison", "recommendation", "review", "alternative", "pricing", "tutorial", "general"];

function parseAnalysis(raw: string): { lang: string; cat: string } | null {
  try {
    const jsonMatch = raw.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    const lang = (parsed.lang ?? "").trim().toLowerCase().slice(0, 2);
    const cat = (parsed.cat ?? "").trim().toLowerCase();
    if (lang.length === 2 && /^[a-z]{2}$/.test(lang)) {
      return { lang, cat: VALID_CATEGORIES.includes(cat) ? cat : "general" };
    }
    return null;
  } catch {
    return null;
  }
}

export async function analyzePrompt(text: string): Promise<PromptAnalysis> {
  const prompt = DETECT_PROMPT(text);

  for (const provider of PROVIDERS) {
    const apiKey = process.env[provider.keyEnv];
    if (!apiKey) continue;

    try {
      const res = await fetch(provider.url, {
        method: "POST",
        headers: provider.headers(apiKey),
        body: JSON.stringify(provider.body(prompt)),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const result = parseAnalysis(provider.extract(data));

      if (result) {
        return {
          language: result.lang,
          country: LANG_TO_COUNTRY[result.lang] || "US",
          category: result.cat,
        };
      }
    } catch {
      continue;
    }
  }

  return { ...guessFromText(text), category: "general" };
}

export async function detectLanguage(text: string): Promise<{ language: string; country: string }> {
  const result = await analyzePrompt(text);
  return { language: result.language, country: result.country };
}

function guessFromText(text: string): { language: string; country: string } {
  const lower = text.toLowerCase();

  const turkishChars = /[çğıöşü]/;
  if (turkishChars.test(lower)) return { language: "tr", country: "TR" };

  const germanChars = /[äöüß]/;
  if (germanChars.test(lower)) return { language: "de", country: "DE" };

  const frenchPatterns = /[àâæçéèêëïîôœùûüÿ]/;
  if (frenchPatterns.test(lower)) return { language: "fr", country: "FR" };

  const spanishChars = /[ñáéíóú¿¡]/;
  if (spanishChars.test(lower)) return { language: "es", country: "ES" };

  return { language: "en", country: "US" };
}
