import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

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
      .select("id, brand_name")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { data: latestScan } = await supabaseAdmin
      .from("scan_results")
      .select("scanned_at")
      .eq("domain_id", domainId)
      .order("scanned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestScan) {
      return NextResponse.json({ gaps: [] });
    }

    const batchStart = new Date(
      new Date(latestScan.scanned_at).getTime() - 60 * 60 * 1000
    ).toISOString();

    const { data: ownResults } = await supabaseAdmin
      .from("scan_results")
      .select("prompt_id, ai_engine, brand_mentioned")
      .eq("domain_id", domainId)
      .gte("scanned_at", batchStart);

    const { data: competitors } = await supabaseAdmin
      .from("competitors")
      .select("id, brand_name, url")
      .eq("domain_id", domainId);

    if (!competitors?.length) {
      return NextResponse.json({ gaps: [] });
    }

    const { data: compResults } = await supabaseAdmin
      .from("competitor_scan_results")
      .select("competitor_id, prompt_id, ai_engine, brand_mentioned, position")
      .in(
        "competitor_id",
        competitors.map((c) => c.id)
      )
      .gte("scanned_at", batchStart);

    const compMap = new Map(competitors.map((c) => [c.id, c]));

    const { data: prompts } = await supabaseAdmin
      .from("prompts")
      .select("id, text")
      .eq("domain_id", domainId);

    const promptMap = new Map((prompts || []).map((p) => [p.id, p.text]));

    // Fetch existing article keywords to exclude covered prompts
    const { data: existingArticles } = await supabaseAdmin
      .from("articles")
      .select("target_keyword")
      .eq("domain_id", domainId);

    const coveredKeywords = new Set(
      (existingArticles || []).map((a) => a.target_keyword?.toLowerCase().trim()).filter(Boolean)
    );

    const ownMentions = new Set(
      (ownResults || [])
        .filter((r) => r.brand_mentioned)
        .map((r) => `${r.prompt_id}:${r.ai_engine}`)
    );

    interface Gap {
      promptId: string;
      promptText: string;
      engine: string;
      competitor: string;
      competitorUrl: string;
      competitorPosition: number | null;
    }

    const gaps: Gap[] = [];

    for (const cr of compResults || []) {
      if (!cr.brand_mentioned) continue;

      const key = `${cr.prompt_id}:${cr.ai_engine}`;
      if (ownMentions.has(key)) continue;

      const comp = compMap.get(cr.competitor_id);
      if (!comp) continue;

      const promptText = promptMap.get(cr.prompt_id) || "";
      if (coveredKeywords.has(promptText.toLowerCase().trim())) continue;

      gaps.push({
        promptId: cr.prompt_id,
        promptText,
        engine: cr.ai_engine,
        competitor: comp.brand_name,
        competitorUrl: comp.url,
        competitorPosition: cr.position,
      });
    }

    return NextResponse.json({ gaps });
  } catch (err) {
    console.error("Gaps API error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
