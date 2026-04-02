import { supabaseAdmin } from "@/lib/supabase/server";
import { engines, type BrandAnalysis } from "@/lib/ai-engines";
import { buildScanPrompt } from "./prompt-builder";
import { parseResponse } from "./response-parser";

const ENGINE_NAME_MAP: Record<string, string> = {
  chatgpt: "chatgpt",
  perplexity: "perplexity",
  gemini: "gemini",
  claude: "claude",
  deepseek: "deepseek",
  grok: "grok",
  mistral: "mistral",
};

const RUNS_PER_PROMPT = 1;
const PROMPT_BATCH_SIZE = 3;

const ENGINE_PRICING: Record<string, { input: number; output: number; perRequest?: number }> = {
  chatgpt:    { input: 0.40, output: 1.60 },
  perplexity: { input: 1.00, output: 1.00, perRequest: 0.005 },
  gemini:     { input: 0.30, output: 2.50 },
  claude:     { input: 1.00, output: 5.00 },
  deepseek:   { input: 0.27, output: 1.10 },
  grok:       { input: 0.20, output: 0.50 },
  mistral:    { input: 0.20, output: 0.60 },
};

async function setScanStatus(domainId: string, status: "idle" | "scanning" | "completed") {
  const data: Record<string, unknown> = { scan_status: status };
  if (status === "scanning") {
    data.last_scan_started_at = new Date().toISOString();
  }
  await supabaseAdmin.from("domains").update(data).eq("id", domainId);
}

export async function runSinglePromptScan(domainId: string, promptId: string) {
  const canProceed = await resetStaleScan(domainId);
  if (!canProceed) return;

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("brand_name, url, industry")
    .eq("id", domainId)
    .single();

  const { data: prompt } = await supabaseAdmin
    .from("prompts")
    .select("*")
    .eq("id", promptId)
    .single();

  if (!domain || !prompt) return;

  await setScanStatus(domainId, "scanning");

  try {
    const scanPrompt = buildScanPrompt(prompt.text, domain.industry);

    for (let run = 0; run < RUNS_PER_PROMPT; run++) {
      await Promise.allSettled(
        engines.map(async (engine) => {
          const result = await engine.query(scanPrompt);
          if (result.error) {
            console.error(`[Scan] ${engine.name} error (prompt scan, run ${run}):`, result.error);
            return;
          }

          const parsed = parseResponse(result.response, domain.brand_name, domain.url);
          await supabaseAdmin.from("scan_results").insert({
            domain_id: domainId,
            prompt_id: promptId,
            ai_engine: ENGINE_NAME_MAP[engine.name],
            run_index: run,
            response: result.response,
            brand_mentioned: parsed.brandMentioned,
            position: parsed.position,
            sentiment: parsed.sentiment,
            citations: result.citations ?? [],
          });
        })
      );
    }

    await setScanStatus(domainId, "completed");
  } catch (err) {
    await setScanStatus(domainId, "idle");
    throw err;
  }
}

export async function runSingleCompetitorScan(domainId: string, competitorId: string) {
  const canProceed = await resetStaleScan(domainId);
  if (!canProceed) return;

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("brand_name, url, industry")
    .eq("id", domainId)
    .single();

  const { data: prompts } = await supabaseAdmin
    .from("prompts")
    .select("*")
    .eq("domain_id", domainId)
    .eq("is_active", true);

  const { data: competitor } = await supabaseAdmin
    .from("competitors")
    .select("*")
    .eq("id", competitorId)
    .single();

  if (!domain || !competitor || !prompts) return;

  await setScanStatus(domainId, "scanning");

  try {
    for (const prompt of prompts) {
      const scanPrompt = buildScanPrompt(prompt.text, domain.industry);

      await Promise.allSettled(
        engines.map(async (engine) => {
          const result = await engine.query(scanPrompt);
          if (result.error) {
            console.error(`[Scan] ${engine.name} error (competitor scan):`, result.error);
            return;
          }

          const parsed = parseResponse(result.response, competitor.brand_name, competitor.url);
          await supabaseAdmin.from("competitor_scan_results").insert({
            competitor_id: competitorId,
            prompt_id: prompt.id,
            ai_engine: ENGINE_NAME_MAP[engine.name],
            run_index: 0,
            brand_mentioned: parsed.brandMentioned,
            mention_count: parsed.mentionCount,
            position: parsed.position,
          });
        })
      );
    }

    await setScanStatus(domainId, "completed");
  } catch (err) {
    await setScanStatus(domainId, "idle");
    throw err;
  }
}

interface ScanProgress {
  total: number;
  completed: number;
  errors: string[];
}

const STALE_SCAN_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

async function resetStaleScan(domainId: string): Promise<boolean> {
  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("scan_status, last_scan_started_at")
    .eq("id", domainId)
    .single();

  if (
    domain?.scan_status === "scanning" &&
    domain.last_scan_started_at &&
    Date.now() - new Date(domain.last_scan_started_at).getTime() > STALE_SCAN_THRESHOLD_MS
  ) {
    console.warn(`[Scan] Stale scan detected for ${domainId}, resetting to idle`);
    await setScanStatus(domainId, "idle");
    return true;
  }

  if (domain?.scan_status === "scanning") {
    return false;
  }

  return true;
}

export async function runDomainScan(
  domainId: string,
  onProgress?: (progress: ScanProgress) => void
): Promise<{ analyses: BrandAnalysis[]; progress: ScanProgress }> {
  const canProceed = await resetStaleScan(domainId);
  if (!canProceed) {
    throw new Error("Scan already in progress for this domain");
  }

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("id, brand_name, url, industry")
    .eq("id", domainId)
    .single();

  if (!domain) throw new Error("Domain not found");

  const { data: prompts } = await supabaseAdmin
    .from("prompts")
    .select("*")
    .eq("domain_id", domainId)
    .eq("is_active", true);

  const { data: competitors } = await supabaseAdmin
    .from("competitors")
    .select("*")
    .eq("domain_id", domainId);

  const activePrompts = prompts ?? [];
  const activeCompetitors = competitors ?? [];

  if (activePrompts.length === 0) throw new Error("No active prompts to scan");

  await setScanStatus(domainId, "scanning");

  try {
  const totalCalls = activePrompts.length * engines.length * RUNS_PER_PROMPT;
  const progress: ScanProgress = {
    total: totalCalls,
    completed: 0,
    errors: [],
  };

  const analyses: BrandAnalysis[] = [];
  const tokenUsage: Record<string, { input: number; output: number; requests: number }> = {};
  for (const e of engines) {
    tokenUsage[e.name] = { input: 0, output: 0, requests: 0 };
  }

  async function scanPrompt(prompt: { id: string; text: string }) {
    const scanPrompt = buildScanPrompt(prompt.text, domain!.industry);
    const promptAnalyses: BrandAnalysis[] = [];

    for (let run = 0; run < RUNS_PER_PROMPT; run++) {
      const engineResults = await Promise.allSettled(
        engines.map(async (engine) => {
          const result = await engine.query(scanPrompt);

          if (result.error) {
            console.error(`[Scan] ${engine.name} error (run ${run}):`, result.error);
            progress.errors.push(`${engine.name} run${run}: ${result.error}`);
            progress.completed++;
            onProgress?.(progress);

            await supabaseAdmin.from("scan_results").insert({
              domain_id: domainId,
              prompt_id: prompt.id,
              ai_engine: ENGINE_NAME_MAP[engine.name],
              run_index: run,
              response: `[Error: ${result.error}]`,
              brand_mentioned: false,
              position: null,
              sentiment: null,
              citations: [],
            });

            return null;
          }

          if (result.inputTokens) tokenUsage[engine.name].input += result.inputTokens;
          if (result.outputTokens) tokenUsage[engine.name].output += result.outputTokens;
          tokenUsage[engine.name].requests++;

          const brandParsed = parseResponse(result.response, domain!.brand_name, domain!.url);

          const analysis: BrandAnalysis = {
            engine: engine.name,
            response: result.response,
            brandMentioned: brandParsed.brandMentioned,
            position: brandParsed.position,
            sentiment: brandParsed.sentiment,
          };

          await supabaseAdmin.from("scan_results").insert({
            domain_id: domainId,
            prompt_id: prompt.id,
            ai_engine: ENGINE_NAME_MAP[engine.name],
            run_index: run,
            response: result.response,
            brand_mentioned: brandParsed.brandMentioned,
            position: brandParsed.position,
            sentiment: brandParsed.sentiment,
            citations: result.citations ?? [],
          });

          for (const comp of activeCompetitors) {
            const compParsed = parseResponse(result.response, comp.brand_name, comp.url);
            await supabaseAdmin.from("competitor_scan_results").insert({
              competitor_id: comp.id,
              prompt_id: prompt.id,
              ai_engine: ENGINE_NAME_MAP[engine.name],
              run_index: run,
              brand_mentioned: compParsed.brandMentioned,
              mention_count: compParsed.mentionCount,
              position: compParsed.position,
            });
          }

          progress.completed++;
          onProgress?.(progress);
          return analysis;
        })
      );

      for (const r of engineResults) {
        if (r.status === "fulfilled" && r.value) {
          promptAnalyses.push(r.value);
        }
      }
    }

    return promptAnalyses;
  }

  for (let i = 0; i < activePrompts.length; i += PROMPT_BATCH_SIZE) {
    const batch = activePrompts.slice(i, i + PROMPT_BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((prompt) => scanPrompt(prompt))
    );

    for (const r of batchResults) {
      if (r.status === "fulfilled") {
        analyses.push(...r.value);
      }
    }
  }

  console.log("\n=== SCAN COST BREAKDOWN ===");
  let totalCost = 0;
  for (const [name, usage] of Object.entries(tokenUsage)) {
    const pricing = ENGINE_PRICING[name];
    if (!pricing) continue;
    const inputCost = (usage.input / 1_000_000) * pricing.input;
    const outputCost = (usage.output / 1_000_000) * pricing.output;
    const requestCost = (pricing.perRequest ?? 0) * usage.requests;
    const engineTotal = inputCost + outputCost + requestCost;
    totalCost += engineTotal;
    console.log(
      `[${name.padEnd(10)}] ${usage.requests} reqs | ` +
      `${usage.input.toLocaleString()} in / ${usage.output.toLocaleString()} out tokens | ` +
      `$${engineTotal.toFixed(4)}`
    );
  }
  console.log(`\nTOTAL SCAN COST: $${totalCost.toFixed(4)}`);
  console.log("===========================\n");

  await supabaseAdmin
    .from("domains")
    .update({ scan_status: "completed", first_scan_done: true })
    .eq("id", domainId);

  return { analyses, progress };
  } catch (err) {
    await setScanStatus(domainId, "idle");
    throw err;
  }
}
