import { supabaseAdmin } from "@/lib/supabase/server";

export interface PromptMover {
  promptText: string;
  promptId: string;
  metric: "mentionRate" | "rank";
  previousValue: number;
  currentValue: number;
  changePercent: number;
}

export async function getDomainStats(domainId: string) {
  const { data: latestScanRow } = await supabaseAdmin
    .from("scan_results")
    .select("scanned_at")
    .eq("domain_id", domainId)
    .order("scanned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestScanRow) {
    return {
      mentionRate: 0,
      avgPosition: null as number | null,
      sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
      lastScan: null as string | null,
      engineBreakdown: [] as { engine: string; mentionRate: number; avgPosition: number | null }[],
      promptResults: [] as {
        promptText: string;
        promptId: string;
        language?: string | null;
        country?: string | null;
        mentionRate: number;
        avgPosition: number | null;
        engines: { engine: string; mentioned: boolean; position: number | null; runs: number; mentionedRuns: number }[];
      }[],
      dailyTrend: [] as { date: string; mentionRate: number; avgPosition: number | null }[],
      trendRaw: [] as { date: string; engine: string; promptId: string; promptText: string; brandMentioned: boolean; position: number | null }[],
      competitorTrendRaw: [] as { date: string; engine: string; promptId: string; promptText: string; competitorId: string; competitorName: string; brandMentioned: boolean; position: number | null }[],
      competitorComparison: [] as { name: string; url: string; mentionRate: number; avgPosition: number | null; isOwn: boolean }[],
      topMovers: { risers: [] as PromptMover[], decliners: [] as PromptMover[] },
    };
  }

  const latestScannedAt = new Date(latestScanRow.scanned_at);
  const batchStart = new Date(latestScannedAt.getTime() - 60 * 60 * 1000);

  const { data: latestRows } = await supabaseAdmin
    .from("scan_results")
    .select("id, domain_id, prompt_id, ai_engine, run_index, response, brand_mentioned, position, sentiment, scanned_at")
    .eq("domain_id", domainId)
    .gte("scanned_at", batchStart.toISOString())
    .order("scanned_at", { ascending: false });

  const latestResultsRaw = latestRows ?? [];

  const promptIds = [...new Set(latestResultsRaw.map((r) => r.prompt_id))];
  const { data: promptRows } = await supabaseAdmin
    .from("prompts")
    .select("id, text, language, country")
    .in("id", promptIds);

  const promptMap: Record<string, { text: string; language: string | null; country: string | null }> = {};
  for (const p of promptRows ?? []) {
    promptMap[p.id] = { text: p.text, language: p.language, country: p.country };
  }

  const latestResults = latestResultsRaw.map((r) => ({
    id: r.id,
    promptId: r.prompt_id,
    aiEngine: r.ai_engine,
    brandMentioned: r.brand_mentioned,
    position: r.position,
    sentiment: r.sentiment as "positive" | "negative" | "neutral" | null,
    scannedAt: r.scanned_at,
    prompt: promptMap[r.prompt_id] ?? { text: "", language: null, country: null },
  }));

  const totalRuns = latestResults.length;
  const mentionedRuns = latestResults.filter((r) => r.brandMentioned).length;
  const mentionRate = totalRuns > 0 ? Math.round((mentionedRuns / totalRuns) * 100) : 0;

  const positionResults = latestResults.filter((r) => r.position !== null);
  const avgPosition =
    positionResults.length > 0
      ? Math.round((positionResults.reduce((s, r) => s + (r.position ?? 0), 0) / positionResults.length) * 10) / 10
      : null;

  const mentionedWithSentiment = latestResults.filter((r) => r.sentiment);
  const sentimentTotal = mentionedWithSentiment.length || 1;
  const sentimentBreakdown = {
    positive: Math.round((mentionedWithSentiment.filter((r) => r.sentiment === "positive").length / sentimentTotal) * 100),
    negative: Math.round((mentionedWithSentiment.filter((r) => r.sentiment === "negative").length / sentimentTotal) * 100),
    neutral: Math.round((mentionedWithSentiment.filter((r) => r.sentiment === "neutral").length / sentimentTotal) * 100),
  };

  const engineGroups: Record<string, typeof latestResults> = {};
  for (const r of latestResults) {
    if (!engineGroups[r.aiEngine]) engineGroups[r.aiEngine] = [];
    engineGroups[r.aiEngine].push(r);
  }
  const engineBreakdown = Object.entries(engineGroups).map(([engine, items]) => {
    const mentioned = items.filter((i) => i.brandMentioned).length;
    const withPos = items.filter((i) => i.position !== null);
    return {
      engine,
      mentionRate: Math.round((mentioned / items.length) * 100),
      avgPosition:
        withPos.length > 0
          ? Math.round((withPos.reduce((s, i) => s + (i.position ?? 0), 0) / withPos.length) * 10) / 10
          : null,
    };
  });

  const promptGroups: Record<string, typeof latestResults> = {};
  for (const r of latestResults) {
    if (!promptGroups[r.promptId]) promptGroups[r.promptId] = [];
    promptGroups[r.promptId].push(r);
  }

  const promptResults = Object.entries(promptGroups).map(([promptId, items]) => {
    const mentioned = items.filter((i) => i.brandMentioned).length;
    const withPos = items.filter((i) => i.position !== null);

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
        withPos.length > 0
          ? Math.round((withPos.reduce((s, i) => s + (i.position ?? 0), 0) / withPos.length) * 10) / 10
          : null,
      engines: Object.entries(perEngine).map(([engine, runs]) => {
        const mentionedItems = runs.filter((r) => r.sentiment);
        const majorSentiment = mentionedItems.length > 0
          ? (() => {
              const counts = { positive: 0, negative: 0, neutral: 0 };
              for (const r of mentionedItems) counts[r.sentiment!]++;
              return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as "positive" | "negative" | "neutral";
            })()
          : null;
        return {
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
          sentiment: majorSentiment,
          scanResultId: runs[0]?.id ?? null,
        };
      }),
    };
  });

  const scanResultIds = latestResultsRaw.map((r) => r.id);
  const { data: insightRows } = scanResultIds.length > 0
    ? await supabaseAdmin
        .from("scan_insights")
        .select("id, scan_result_id")
        .in("scan_result_id", scanResultIds)
    : { data: [] };

  const insightMap: Record<string, string> = {};
  for (const ins of insightRows ?? []) {
    insightMap[ins.scan_result_id] = ins.id;
  }

  for (const pr of promptResults) {
    for (const eng of pr.engines) {
      (eng as typeof eng & { insightId: string | null }).insightId = insightMap[eng.scanResultId] ?? null;
    }
  }

  const { data: allScanRows } = await supabaseAdmin
    .from("scan_results")
    .select("scanned_at, brand_mentioned, position, ai_engine, prompt_id")
    .eq("domain_id", domainId)
    .order("scanned_at", { ascending: true });

  const allScansRaw = allScanRows ?? [];

  const allPromptIds = [...new Set(allScansRaw.map((r) => r.prompt_id))];
  const { data: allPromptRows } = await supabaseAdmin
    .from("prompts")
    .select("id, text")
    .in("id", allPromptIds);

  const allPromptMap: Record<string, string> = {};
  for (const p of allPromptRows ?? []) {
    allPromptMap[p.id] = p.text;
  }

  const trendRaw = allScansRaw.map((s) => ({
    date: s.scanned_at.split("T")[0],
    engine: s.ai_engine,
    promptId: s.prompt_id,
    promptText: allPromptMap[s.prompt_id] ?? "",
    brandMentioned: s.brand_mentioned,
    position: s.position,
  }));

  const dayMap: Record<string, { total: number; mentioned: number; positions: number[] }> = {};
  for (const scan of allScansRaw) {
    const key = scan.scanned_at.split("T")[0];
    if (!dayMap[key]) dayMap[key] = { total: 0, mentioned: 0, positions: [] };
    dayMap[key].total++;
    if (scan.brand_mentioned) dayMap[key].mentioned++;
    if (scan.position !== null) dayMap[key].positions.push(scan.position);
  }

  const dailyTrend = Object.entries(dayMap)
    .slice(-30)
    .map(([date, data]) => ({
      date: formatDate(date),
      mentionRate: Math.round((data.mentioned / data.total) * 100),
      avgPosition:
        data.positions.length > 0
          ? Math.round((data.positions.reduce((a, b) => a + b, 0) / data.positions.length) * 10) / 10
          : null,
    }));

  const { data: domainRow } = await supabaseAdmin
    .from("domains")
    .select("brand_name, url")
    .eq("id", domainId)
    .single();

  const { data: competitorRows } = await supabaseAdmin
    .from("competitors")
    .select("id, brand_name, url")
    .eq("domain_id", domainId);

  const competitors = competitorRows ?? [];

  const competitorComparison: { name: string; url: string; mentionRate: number; avgPosition: number | null; isOwn: boolean }[] = [
    { name: domainRow?.brand_name ?? "You", url: domainRow?.url ?? "", mentionRate, avgPosition, isOwn: true },
  ];

  const competitorTrendRaw: {
    date: string;
    engine: string;
    promptId: string;
    promptText: string;
    competitorId: string;
    competitorName: string;
    brandMentioned: boolean;
    position: number | null;
  }[] = [];

  for (const comp of competitors) {
    const { data: compResults } = await supabaseAdmin
      .from("competitor_scan_results")
      .select("*")
      .eq("competitor_id", comp.id)
      .gte("scanned_at", batchStart.toISOString());

    const compRows = compResults ?? [];
    const compMentioned = compRows.filter((r) => r.brand_mentioned).length;
    const compTotal = compRows.length || 1;
    const compWithPos = compRows.filter((r) => r.position !== null);
    competitorComparison.push({
      name: comp.brand_name,
      url: comp.url,
      mentionRate: Math.round((compMentioned / compTotal) * 100),
      avgPosition:
        compWithPos.length > 0
          ? Math.round((compWithPos.reduce((s, r) => s + (r.position ?? 0), 0) / compWithPos.length) * 10) / 10
          : null,
      isOwn: false,
    });

    const { data: allCompScanRows } = await supabaseAdmin
      .from("competitor_scan_results")
      .select("scanned_at, brand_mentioned, position, ai_engine, prompt_id")
      .eq("competitor_id", comp.id)
      .order("scanned_at", { ascending: true });

    const allCompScans = allCompScanRows ?? [];

    const compPromptIds = [...new Set(allCompScans.map((r) => r.prompt_id))];
    let compPromptMap: Record<string, string> = {};
    if (compPromptIds.length > 0) {
      const { data: compPromptRows } = await supabaseAdmin
        .from("prompts")
        .select("id, text")
        .in("id", compPromptIds);
      for (const p of compPromptRows ?? []) {
        compPromptMap[p.id] = p.text;
      }
    }

    for (const s of allCompScans) {
      competitorTrendRaw.push({
        date: s.scanned_at.split("T")[0],
        engine: s.ai_engine,
        promptId: s.prompt_id,
        promptText: compPromptMap[s.prompt_id] ?? "",
        competitorId: comp.id,
        competitorName: comp.brand_name,
        brandMentioned: s.brand_mentioned,
        position: s.position,
      });
    }
  }

  // Top Movers: compare last 2 scan batches per prompt
  const topMovers = computeTopMovers(allScansRaw, allPromptMap);

  return {
    mentionRate,
    avgPosition,
    sentimentBreakdown,
    lastScan: latestScannedAt.toLocaleDateString(),
    engineBreakdown,
    promptResults,
    dailyTrend,
    trendRaw,
    competitorTrendRaw,
    competitorComparison,
    topMovers,
  };
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function computeTopMovers(
  allScans: { scanned_at: string; brand_mentioned: boolean; position: number | null; prompt_id: string }[],
  promptMap: Record<string, string>,
): { risers: PromptMover[]; decliners: PromptMover[] } {
  const empty = { risers: [], decliners: [] };
  if (allScans.length === 0) return empty;

  const dates = [...new Set(allScans.map(s => s.scanned_at.split("T")[0]))].sort();
  if (dates.length < 2) return empty;

  const currentDate = dates[dates.length - 1];
  const previousDate = dates[dates.length - 2];

  const bucketByPrompt = (rows: typeof allScans) => {
    const map = new Map<string, { total: number; mentioned: number; positions: number[] }>();
    for (const r of rows) {
      let entry = map.get(r.prompt_id);
      if (!entry) { entry = { total: 0, mentioned: 0, positions: [] }; map.set(r.prompt_id, entry); }
      entry.total++;
      if (r.brand_mentioned) entry.mentioned++;
      if (r.position !== null) entry.positions.push(r.position);
    }
    return map;
  };

  const prevRows = allScans.filter(s => s.scanned_at.split("T")[0] === previousDate);
  const currRows = allScans.filter(s => s.scanned_at.split("T")[0] === currentDate);

  const prevBucket = bucketByPrompt(prevRows);
  const currBucket = bucketByPrompt(currRows);

  const allMovers: PromptMover[] = [];

  const allPromptIds = new Set([...prevBucket.keys(), ...currBucket.keys()]);
  for (const pid of allPromptIds) {
    const prev = prevBucket.get(pid);
    const curr = currBucket.get(pid);
    if (!prev || !curr) continue;

    const prevMR = prev.total > 0 ? Math.round((prev.mentioned / prev.total) * 100) : 0;
    const currMR = curr.total > 0 ? Math.round((curr.mentioned / curr.total) * 100) : 0;
    const mrDiff = currMR - prevMR;

    if (mrDiff !== 0) {
      const changePercent = prevMR > 0 ? Math.round((mrDiff / prevMR) * 100) : (currMR > 0 ? 100 : 0);
      allMovers.push({
        promptText: promptMap[pid] ?? "",
        promptId: pid,
        metric: "mentionRate",
        previousValue: prevMR,
        currentValue: currMR,
        changePercent,
      });
    }

    const prevAvgPos = prev.positions.length > 0
      ? Math.round((prev.positions.reduce((a, b) => a + b, 0) / prev.positions.length) * 10) / 10
      : null;
    const currAvgPos = curr.positions.length > 0
      ? Math.round((curr.positions.reduce((a, b) => a + b, 0) / curr.positions.length) * 10) / 10
      : null;

    if (prevAvgPos !== null && currAvgPos !== null && prevAvgPos !== currAvgPos) {
      const rankImprovement = prevAvgPos - currAvgPos;
      const changePercent = Math.round((rankImprovement / prevAvgPos) * 100);
      allMovers.push({
        promptText: promptMap[pid] ?? "",
        promptId: pid,
        metric: "rank",
        previousValue: prevAvgPos,
        currentValue: currAvgPos,
        changePercent,
      });
    }
  }

  const risers = allMovers
    .filter(m => m.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 2);

  const decliners = allMovers
    .filter(m => m.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 2);

  return { risers, decliners };
}
