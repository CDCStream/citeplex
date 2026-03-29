const AHREFS_API_BASE = "https://api.ahrefs.com/v3";

function getApiKey(): string {
  const key = process.env.AHREFS_API_KEY;
  if (!key) throw new Error("AHREFS_API_KEY is not configured");
  return key;
}

export interface AhrefsKeywordData {
  keyword: string;
  country: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  global_volume: number | null;
  traffic_potential: number | null;
  parent_topic: string | null;
}

interface AhrefsKeywordsOverviewResponse {
  keywords: Array<{
    keyword: string;
    volume: number;
    difficulty: number;
    cpc: number;
    global_volume: number;
    traffic_potential?: number;
    parent_topic?: string;
  }>;
}

export async function fetchKeywordMetrics(
  keywords: string[],
  country: string = "us"
): Promise<AhrefsKeywordData[]> {
  if (keywords.length === 0) return [];

  const apiKey = getApiKey();
  const batchSize = 100;
  const results: AhrefsKeywordData[] = [];

  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize);
    const params = new URLSearchParams({
      output: "json",
      select: "keyword,volume,difficulty,cpc,global_volume,traffic_potential,parent_topic",
      keywords: batch.join(","),
      country,
    });

    const url = `${AHREFS_API_BASE}/keywords-explorer/overview?${params}`;
    console.log(`[Ahrefs] Fetching metrics for ${batch.length} keywords (country=${country})`);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[Ahrefs] API error (${res.status}):`, body);
      for (const kw of batch) {
        results.push({
          keyword: kw,
          country,
          volume: null,
          difficulty: null,
          cpc: null,
          global_volume: null,
          traffic_potential: null,
          parent_topic: null,
        });
      }
      continue;
    }

    const data: AhrefsKeywordsOverviewResponse = await res.json();
    console.log(`[Ahrefs] Got ${data.keywords?.length ?? 0} results`);
    if (data.keywords?.length > 0) {
      const sample = data.keywords[0];
      console.log(`[Ahrefs] Sample: keyword="${sample.keyword}" vol=${sample.volume} kd=${sample.difficulty} cpc=${sample.cpc} tp=${sample.traffic_potential} parent="${sample.parent_topic}"`);
    }

    const map = new Map(
      (data.keywords || []).map((k) => [k.keyword.toLowerCase(), k])
    );

    for (const kw of batch) {
      const row = map.get(kw.toLowerCase());
      results.push({
        keyword: kw,
        country,
        volume: row?.volume ?? null,
        difficulty: row?.difficulty ?? null,
        cpc: row?.cpc ?? null,
        global_volume: row?.global_volume ?? null,
        traffic_potential: row?.traffic_potential ?? null,
        parent_topic: row?.parent_topic ?? null,
      });
    }
  }

  return results;
}
