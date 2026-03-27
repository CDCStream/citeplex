import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fetchKeywordMetrics } from "@/lib/ahrefs/client";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainId } = await params;

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id, primary_country")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { data: prompts } = await supabaseAdmin
      .from("prompts")
      .select("id, text")
      .eq("domain_id", domainId)
      .eq("is_active", true);

    if (!prompts?.length) {
      return NextResponse.json({ keywords: [] });
    }

    const country = (domain.primary_country || "US").toLowerCase();
    const promptIds = prompts.map((p) => p.id);

    const { data: cached } = await supabaseAdmin
      .from("keyword_metrics")
      .select("*")
      .in("prompt_id", promptIds)
      .eq("country", country);

    interface CachedMetric {
      id?: string;
      prompt_id: string;
      keyword: string;
      country: string;
      volume: number | null;
      difficulty: number | null;
      cpc: number | null;
      traffic_potential: number | null;
      global_volume: number | null;
      parent_topic: string | null;
      fetched_at: string;
    }

    const now = Date.now();
    const freshMap = new Map<string, CachedMetric>();
    const stalePromptIds: string[] = [];

    for (const p of prompts) {
      const hit = (cached || []).find((c) => c.prompt_id === p.id);
      if (hit && now - new Date(hit.fetched_at).getTime() < CACHE_TTL_MS) {
        freshMap.set(p.id, hit);
      } else {
        stalePromptIds.push(p.id);
      }
    }

    if (stalePromptIds.length > 0 && process.env.AHREFS_API_KEY) {
      const stalePrompts = prompts.filter((p) =>
        stalePromptIds.includes(p.id)
      );
      const keywords = stalePrompts.map((p) => p.text);

      try {
        const results = await fetchKeywordMetrics(keywords, country);

        for (let i = 0; i < stalePrompts.length; i++) {
          const prompt = stalePrompts[i];
          const result = results[i];
          if (!result) continue;

          const row = {
            prompt_id: prompt.id,
            keyword: result.keyword,
            country,
            volume: result.volume,
            difficulty: result.difficulty,
            cpc: result.cpc,
            traffic_potential: result.traffic_potential,
            global_volume: result.global_volume,
            parent_topic: result.parent_topic,
            fetched_at: new Date().toISOString(),
          };

          await supabaseAdmin.from("keyword_metrics").upsert(row, {
            onConflict: "prompt_id,keyword,country",
          });

          freshMap.set(prompt.id, { ...row, id: prompt.id });
        }
      } catch (err) {
        console.error("Ahrefs API fetch error:", err);
      }
    }

    const keywordsResult = prompts.map((p) => {
      const metrics = freshMap.get(p.id);
      return {
        promptId: p.id,
        keyword: p.text,
        volume: metrics?.volume ?? null,
        difficulty: metrics?.difficulty ?? null,
        cpc: metrics?.cpc ?? null,
        trafficPotential: metrics?.traffic_potential ?? null,
        globalVolume: metrics?.global_volume ?? null,
        parentTopic: metrics?.parent_topic ?? null,
      };
    });

    return NextResponse.json({ keywords: keywordsResult });
  } catch (err) {
    console.error("Keywords API error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}
