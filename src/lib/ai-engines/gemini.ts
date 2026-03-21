import type { AiEngine, AiQueryResult } from "./types";

export class GeminiEngine implements AiEngine {
  name = "gemini" as const;

  async query(prompt: string): Promise<AiQueryResult> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) return { engine: this.name, response: "", error: "GOOGLE_GEMINI_API_KEY not set" };

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ google_search: {} }],
          }),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!res.ok) {
        const errorBody = await res.text();
        return { engine: this.name, response: "", error: `Gemini ${res.status}: ${errorBody}` };
      }

      const data = await res.json();
      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? "")
          .join("") ?? "";

      return {
        engine: this.name,
        response: text,
        inputTokens: data.usageMetadata?.promptTokenCount,
        outputTokens: data.usageMetadata?.candidatesTokenCount,
      };
    } catch (err) {
      return { engine: this.name, response: "", error: `Gemini error: ${(err as Error).message}` };
    }
  }
}
