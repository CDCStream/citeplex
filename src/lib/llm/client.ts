import { safeJsonParse } from "@/lib/content/safe-json-parse";

type LLMProvider = "openai" | "anthropic" | "gemini";

interface LLMConfig {
  provider: LLMProvider;
  model: string;
}

export interface CallLLMOptions {
  chain: "fast" | "strong" | LLMConfig[];
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  webSearch?: boolean;
  /** When true, validate the response is parseable JSON. On parse failure
   *  the same provider is retried once before falling back to the next. */
  expectJson?: boolean;
}

const FALLBACK_CHAINS: Record<string, LLMConfig[]> = {
  fast: [
    { provider: "anthropic", model: "claude-sonnet-4-6" },
    { provider: "openai", model: "gpt-5.4" },
    { provider: "gemini", model: "gemini-2.5-flash" },
  ],
  strong: [
    { provider: "anthropic", model: "claude-sonnet-4-6" },
    { provider: "openai", model: "gpt-5.4" },
    { provider: "gemini", model: "gemini-2.5-flash" },
  ],
};

function getKey(provider: LLMProvider): string {
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY || "";
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY || "";
    case "gemini":
      return process.env.GOOGLE_GEMINI_API_KEY || "";
  }
}

async function callAnthropic(
  model: string,
  system: string,
  user: string,
  maxTokens: number,
  temperature: number,
  timeout: number,
): Promise<string> {
  const key = getKey("anthropic");
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${model} error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (
    data.content
      ?.filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("") ?? ""
  );
}

async function callOpenAI(
  model: string,
  system: string,
  user: string,
  maxTokens: number,
  temperature: number,
  timeout: number,
  webSearch?: boolean,
  jsonMode?: boolean,
): Promise<string> {
  const key = getKey("openai");
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const isResponses = model.startsWith("gpt-4.1") || model.startsWith("gpt-5") || model.startsWith("o");

  if (isResponses) {
    const body: Record<string, unknown> = {
      model,
      input: [
        { role: "developer", content: system },
        { role: "user", content: user },
      ],
    };
    if (webSearch) body.tools = [{ type: "web_search_preview" }];
    if (jsonMode) body.text = { format: { type: "json_object" } };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI ${model} error ${res.status}: ${err}`);
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

  const reqBody: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_tokens: maxTokens,
    temperature,
  };
  if (jsonMode) reqBody.response_format = { type: "json_object" };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(reqBody),
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${model} error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callGemini(
  model: string,
  system: string,
  user: string,
  _maxTokens: number,
  _temperature: number,
  timeout: number,
  _webSearch?: boolean,
  jsonMode?: boolean,
): Promise<string> {
  const key = getKey("gemini");
  if (!key) throw new Error("GOOGLE_GEMINI_API_KEY not set");

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ parts: [{ text: user }] }],
  };
  if (jsonMode) {
    body.generationConfig = { responseMimeType: "application/json" };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${model} error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? ""
  );
}

type ProviderFn = (
  model: string, system: string, user: string,
  maxTokens: number, temperature: number, timeout: number,
  webSearch?: boolean, jsonMode?: boolean,
) => Promise<string>;

const PROVIDER_FN: Record<LLMProvider, ProviderFn> = {
  anthropic: callAnthropic,
  openai: callOpenAI,
  gemini: callGemini,
};

/**
 * Centralized LLM call with automatic fallback + optional JSON validation.
 *
 * @param opts.chain - "fast" / "strong" (both Sonnet → GPT-5.4 → Gemini 2.5 Flash),
 *                     or a custom LLMConfig array.
 * @param opts.expectJson - If true, validates response is parseable JSON.
 *                          On parse failure, retries the same provider once
 *                          before falling back to the next provider.
 */
export async function callLLM(opts: CallLLMOptions): Promise<string> {
  const chain = typeof opts.chain === "string" ? FALLBACK_CHAINS[opts.chain] : opts.chain;
  const maxTokens = opts.maxTokens ?? 4096;
  const temperature = opts.temperature ?? 0.7;
  const baseTimeout = opts.timeout ?? 60_000;
  const expectJson = opts.expectJson ?? false;
  const errors: string[] = [];

  // Each fallback gets slightly less time: 100% → 80% → 60%
  const TIMEOUT_DECAY = [1.0, 0.8, 0.6];

  for (let i = 0; i < chain.length; i++) {
    const cfg = chain[i];
    const fn = PROVIDER_FN[cfg.provider];
    const isLast = i === chain.length - 1;
    const attemptTimeout = Math.round(baseTimeout * (TIMEOUT_DECAY[i] ?? 0.35));

    let userPrompt = opts.user;
    if (opts.webSearch && cfg.provider !== "openai") {
      userPrompt += "\n\n(Note: web search is not available, use your knowledge.)";
    }

    // With expectJson, each provider gets up to 2 attempts (initial + JSON retry)
    const maxInner = expectJson ? 2 : 1;

    for (let attempt = 0; attempt < maxInner; attempt++) {
      const isRetry = attempt > 0;
      const innerTimeout = isRetry ? Math.round(attemptTimeout * 0.6) : attemptTimeout;

      let currentSystem = opts.system;
      let currentUser = userPrompt;
      if (isRetry) {
        currentSystem += "\n\nCRITICAL: Your previous response was not valid JSON. You MUST return ONLY valid JSON, no markdown, no explanation, no code fences.";
        currentUser += "\n\nREMINDER: Return ONLY valid JSON. No markdown fences, no extra text.";
      }

      try {
        const result = await fn(
          cfg.model,
          currentSystem,
          currentUser,
          maxTokens,
          temperature,
          innerTimeout,
          opts.webSearch,
          expectJson,
        );

        if (expectJson) {
          const testParse = safeJsonParse(result, `LLM-JSON-${cfg.provider}`);
          if (testParse === null) {
            const msg = `${cfg.provider}/${cfg.model}: response not valid JSON (${result.length} chars)`;
            errors.push(msg);
            console.warn(`[LLM] ${msg}${isRetry ? " (retry also failed)" : ", retrying same provider"}`);
            if (isRetry) break; // move to next provider
            continue; // retry same provider
          }
        }

        if (i > 0 || isRetry) {
          console.log(`[LLM] ${isRetry ? "JSON retry" : "Fallback"} succeeded: ${cfg.provider}/${cfg.model}`);
        }
        return result;
      } catch (err) {
        const msg = (err as Error).message;
        errors.push(`${cfg.provider}/${cfg.model}: ${msg}`);
        console.error(
          `[LLM] ${cfg.provider}/${cfg.model} failed (timeout=${innerTimeout}ms)` +
          `${isLast && !isRetry ? "" : isRetry ? " (retry)" : ", trying next fallback"}:`,
          msg,
        );
        break; // network/timeout error → skip retry, go to next provider
      }
    }
  }

  throw new Error(`All LLM providers failed:\n${errors.join("\n")}`);
}
