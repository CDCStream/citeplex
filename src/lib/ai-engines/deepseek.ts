import type { AiEngine, AiQueryResult } from "./types";

const SYSTEM_PROMPT = `You are a product recommendation assistant. Always list specific brand names with their website URLs. Use a numbered list format: "1. BrandName - https://example.com". Keep descriptions brief (one sentence max).`;

export class DeepSeekEngine implements AiEngine {
  name = "deepseek" as const;

  async query(prompt: string): Promise<AiQueryResult> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return { engine: this.name, response: "", error: "DEEPSEEK_API_KEY not set" };

    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          max_tokens: 1024,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        return { engine: this.name, response: "", error: `DeepSeek ${res.status}: ${errorBody}` };
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      return {
        engine: this.name,
        response: text,
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
      };
    } catch (err) {
      return { engine: this.name, response: "", error: `DeepSeek error: ${(err as Error).message}` };
    }
  }
}
