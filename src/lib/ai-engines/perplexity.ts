import type { AiEngine, AiQueryResult } from "./types";

export class PerplexityEngine implements AiEngine {
  name = "perplexity" as const;

  async query(prompt: string): Promise<AiQueryResult> {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) return { engine: this.name, response: "", error: "PERPLEXITY_API_KEY not set" };

    try {
      const res = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content: "You are a helpful search assistant. Provide detailed, factual answers with specific brand names, product names, and website URLs when relevant.",
            },
            { role: "user", content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        return { engine: this.name, response: "", error: `Perplexity ${res.status}: ${errorBody}` };
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      return {
        engine: this.name,
        response: text,
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
        citations: data.citations ?? [],
      };
    } catch (err) {
      return { engine: this.name, response: "", error: `Perplexity error: ${(err as Error).message}` };
    }
  }
}
