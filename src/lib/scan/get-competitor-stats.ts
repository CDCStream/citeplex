import { supabaseAdmin } from "@/lib/supabase/server";

export interface CompetitorPromptResult {
  promptText: string;
  promptId: string;
  language?: string | null;
  country?: string | null;
  mentionRate: number;
  avgPosition: number | null;
  engines: {
    engine: string;
    mentioned: boolean;
    position: number | null;
    runs: number;
    mentionedRuns: number;
  }[];
}

export interface CompetitorStats {
  competitorId: string;
  brandName: string;
  url: string;
  overallMentionRate: number;
  overallAvgPosition: number | null;
  promptResults: CompetitorPromptResult[];
}

export async function getCompetitorStats(competitorId: string): Promise<CompetitorStats | null> {
  const { data: competitor } = await supabaseAdmin
    .from("competitors")
    .select("id, brand_name, url")
    .eq("id", competitorId)
    .single();

  if (!competitor) return null;

  const { data: resultRows } = await supabaseAdmin
    .from("competitor_scan_results")
    .select("id, competitor_id, prompt_id, ai_engine, run_index, brand_mentioned, mention_count, position, scanned_at")
    .eq("competitor_id", competitorId)
    .order("scanned_at", { ascending: false });

  const rawResults = resultRows ?? [];

  if (rawResults.length === 0) {
    return {
      competitorId: competitor.id,
      brandName: competitor.brand_name,
      url: competitor.url,
      overallMentionRate: 0,
      overallAvgPosition: null,
      promptResults: [],
    };
  }

  const promptIds = [...new Set(rawResults.map((r) => r.prompt_id))];
  const { data: promptRows } = await supabaseAdmin
    .from("prompts")
    .select("id, text, language, country")
    .in("id", promptIds);

  const promptMap: Record<string, { text: string; language: string | null; country: string | null }> = {};
  for (const p of promptRows ?? []) {
    promptMap[p.id] = { text: p.text, language: p.language, country: p.country };
  }

  const results = rawResults.map((r) => ({
    promptId: r.prompt_id,
    aiEngine: r.ai_engine,
    brandMentioned: r.brand_mentioned,
    position: r.position,
    prompt: promptMap[r.prompt_id] ?? { text: "", language: null, country: null },
  }));

  const totalMentioned = results.filter((r) => r.brandMentioned).length;
  const overallMentionRate = Math.round((totalMentioned / results.length) * 100);

  const withPos = results.filter((r) => r.position !== null);
  const overallAvgPosition =
    withPos.length > 0
      ? Math.round((withPos.reduce((s, r) => s + (r.position ?? 0), 0) / withPos.length) * 10) / 10
      : null;

  const promptGroups: Record<string, typeof results> = {};
  for (const r of results) {
    if (!promptGroups[r.promptId]) promptGroups[r.promptId] = [];
    promptGroups[r.promptId].push(r);
  }

  const promptResults: CompetitorPromptResult[] = Object.entries(promptGroups).map(([promptId, items]) => {
    const mentioned = items.filter((i) => i.brandMentioned).length;
    const posItems = items.filter((i) => i.position !== null);

    const perEngine: Record<string, typeof items> = {};
    for (const i of items) {
      if (!perEngine[i.aiEngine]) perEngine[i.aiEngine] = [];
      perEngine[i.aiEngine].push(i);
    }

    return {
      promptText: items[0].prompt.text,
      promptId,
      language: items[0].prompt.language,
      country: items[0].prompt.country,
      mentionRate: Math.round((mentioned / items.length) * 100),
      avgPosition:
        posItems.length > 0
          ? Math.round((posItems.reduce((s, i) => s + (i.position ?? 0), 0) / posItems.length) * 10) / 10
          : null,
      engines: Object.entries(perEngine).map(([engine, runs]) => ({
        engine,
        mentioned: runs.some((r) => r.brandMentioned),
        position: (() => {
          const p = runs.filter((r) => r.position !== null);
          return p.length > 0
            ? Math.round((p.reduce((s, r) => s + (r.position ?? 0), 0) / p.length) * 10) / 10
            : null;
        })(),
        runs: runs.length,
        mentionedRuns: runs.filter((r) => r.brandMentioned).length,
      })),
    };
  });

  return {
    competitorId: competitor.id,
    brandName: competitor.brand_name,
    url: competitor.url,
    overallMentionRate,
    overallAvgPosition,
    promptResults,
  };
}
