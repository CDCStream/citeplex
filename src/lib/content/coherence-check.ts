import { callLLM } from "@/lib/llm/client";
import { safeJsonParse } from "./safe-json-parse";

export interface CoherenceResult {
  isCoherent: boolean;
  score: number;
  issues: string[];
  fixedContent: string | null;
}

export async function checkCoherence(
  title: string,
  keyword: string,
  content: string,
  language = "English"
): Promise<CoherenceResult> {
  const truncated = content.slice(0, 15000);

  try {
    const text = await callLLM({
      chain: "fast",
      expectJson: true,
      system: `You are a content quality reviewer. Analyze the article for context coherence — every section must logically flow from the previous one, stay on topic, and build toward the article's thesis.

Check for:
1. Topic drift — sections that wander away from the main topic "${keyword}"
2. Repetition — the same point made more than once in different sections
3. Logical gaps — missing transitions or abrupt topic changes
4. Factual consistency — contradictions within the article
5. Language consistency — all content must be in ${language}

Return ONLY valid JSON:
{
  "isCoherent": true/false,
  "score": 0-100,
  "issues": ["list of specific issues found, empty if none"],
  "needsFix": true/false
}

If needsFix is true, you will be asked to provide a fixed version in a follow-up.
Set isCoherent to true and score >= 80 if the article is publication-ready.`,
      user: `Review this article for coherence:\n\nTitle: ${title}\nKeyword: ${keyword}\nLanguage: ${language}\n\n${truncated}`,
      maxTokens: 2048,
      temperature: 0.2,
      timeout: 15000,
    });

    const result = safeJsonParse<{ isCoherent?: boolean; needsFix?: boolean; score?: number; issues?: string[] }>(text, "CoherenceCheck");
    if (!result) {
      return { isCoherent: true, score: 75, issues: [], fixedContent: null };
    }

    if (result.needsFix && !result.isCoherent) {
      const fixedContent = await fixCoherence(
        title,
        keyword,
        content,
        result.issues || [],
        language
      );
      return {
        isCoherent: false,
        score: result.score as number,
        issues: result.issues || [],
        fixedContent,
      };
    }

    return {
      isCoherent: result.isCoherent ?? true,
      score: result.score ?? 80,
      issues: result.issues || [],
      fixedContent: null,
    };
  } catch (err) {
    console.error("[CoherenceCheck] Failed:", err);
    return { isCoherent: true, score: 75, issues: [], fixedContent: null };
  }
}

async function fixCoherence(
  title: string,
  keyword: string,
  content: string,
  issues: string[],
  language: string
): Promise<string | null> {
  try {
    const text = await callLLM({
      chain: "fast",
      system: `You are a content editor. Fix the coherence issues in this HTML article while preserving all HTML structure, links, images, tables, and formatting.
Fix ONLY the specific issues listed. Do not rewrite sections that are already good.
Keep the article in ${language}. Return ONLY the fixed HTML content.`,
      user: `Fix these coherence issues:\n${issues.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}\n\nTitle: ${title}\nKeyword: ${keyword}\n\nArticle:\n${content}`,
      maxTokens: 8192,
      temperature: 0.3,
      timeout: 30000,
    });

    if (text.includes("<h2") || text.includes("<p")) {
      return text.trim();
    }

    return null;
  } catch (err) {
    console.error("[CoherenceFix] Failed:", err);
    return null;
  }
}
