import { callLLM } from "@/lib/llm/client";
import { safeJsonParse } from "./safe-json-parse";
import { BrandVoiceSchema } from "@/lib/llm/schemas";

export interface BrandVoiceProfile {
  tone: string;
  style: string;
  vocabulary: string;
  sentenceStructure: string;
  personality: string;
  doList: string[];
  dontList: string[];
  sampleExcerpt: string;
}

export async function analyzeBrandVoice(
  sampleTexts: string[]
): Promise<BrandVoiceProfile> {
  const combined = sampleTexts
    .map((t, i) => `--- Sample ${i + 1} ---\n${t.slice(0, 3000)}`)
    .join("\n\n");

  const text = await callLLM({
    chain: "fast",
    system: `You are a writing style analyst. Analyze the provided content samples and extract a detailed brand voice profile.
Include:
- tone: description of the overall tone
- style: writing style characteristics
- vocabulary: vocabulary level and preferences
- sentenceStructure: typical sentence patterns
- personality: brand personality that comes through
- doList: 5-7 specific things this brand does in their writing
- dontList: 5-7 things this brand avoids in their writing
- sampleExcerpt: a 2-3 sentence example that captures this voice perfectly`,
    user: `Analyze the writing style and brand voice from these content samples:\n\n${combined}`,
    maxTokens: 1500,
    temperature: 0.3,
    timeout: 30000,
    schema: BrandVoiceSchema,
    schemaName: "brand_voice",
  });

  const parsed = safeJsonParse<BrandVoiceProfile>(text, "BrandVoice", true);

  return parsed!;
}

export async function scrapePageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Citeplex/1.0; +https://www.citeplex.io)",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return "";

    const html = await res.text();

    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const body = bodyMatch ? bodyMatch[1] : html;

    return body
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);
  } catch {
    return "";
  }
}

export function buildVoiceInstruction(profile: BrandVoiceProfile): string {
  return `## Brand Voice Guidelines
Match this exact writing style:
- Tone: ${profile.tone}
- Style: ${profile.style}
- Vocabulary: ${profile.vocabulary}
- Sentences: ${profile.sentenceStructure}
- Personality: ${profile.personality}
- DO: ${profile.doList.join("; ")}
- DON'T: ${profile.dontList.join("; ")}
- Voice example: "${profile.sampleExcerpt}"`;
}
