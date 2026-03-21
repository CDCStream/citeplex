import type { AiEngine, AiQueryResult } from "./types";

export class ChatGPTEngine implements AiEngine {
  name = "chatgpt" as const;

  async query(prompt: string): Promise<AiQueryResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { engine: this.name, response: "", error: "OPENAI_API_KEY not set" };

    try {
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          tools: [{ type: "web_search_preview" }],
          input: prompt,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        return { engine: this.name, response: "", error: `OpenAI ${res.status}: ${errorBody}` };
      }

      const data = await res.json();
      const text = data.output
        ?.filter((item: { type: string }) => item.type === "message")
        .map((item: { content: { text: string }[] }) =>
          item.content?.map((c: { text: string }) => c.text).join("")
        )
        .join("\n") ?? "";

      return {
        engine: this.name,
        response: text,
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      };
    } catch (err) {
      return { engine: this.name, response: "", error: `OpenAI error: ${(err as Error).message}` };
    }
  }
}
