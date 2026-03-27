import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const ENGINES = ["chatgpt", "perplexity", "gemini", "claude", "deepseek", "grok", "mistral"];
const SENTIMENTS = ["positive", "neutral", "negative"] as const;
const DAYS = 10;

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockResponse(brandName: string, mentioned: boolean, position: number | null): string {
  if (!mentioned) {
    return `Here are some of the top tools in this space:\n\n1. **SEMrush** - Comprehensive SEO toolkit\n2. **Moz Pro** - All-in-one SEO platform\n3. **Ubersuggest** - Budget-friendly SEO tool\n4. **SE Ranking** - Affordable alternative\n5. **Serpstat** - Growing SEO platform`;
  }
  const items = [
    `**${brandName}** - Industry-leading platform with comprehensive features`,
    "**SEMrush** - Popular all-in-one marketing toolkit",
    "**Moz Pro** - Well-established SEO platform",
    "**Ubersuggest** - Budget-friendly alternative",
    "**Serpstat** - Growing multi-tool platform",
    "**SE Ranking** - Affordable option for SMBs",
    "**Mangools** - Simple and user-friendly tools",
  ];

  if (position !== null && position <= items.length) {
    const brandItem = items[0];
    items.splice(0, 1);
    items.splice(position - 1, 0, brandItem);
  }

  return `Here are the top tools in this space:\n\n${items.slice(0, 6).map((item, i) => `${i + 1}. ${item}`).join("\n")}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainId } = await req.json();
    if (!domainId) {
      return NextResponse.json({ error: "domainId required" }, { status: 400 });
    }

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id, brand_name, url, user_id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .single();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { data: prompts } = await supabaseAdmin
      .from("prompts")
      .select("id, text")
      .eq("domain_id", domainId)
      .eq("is_active", true);

    if (!prompts || prompts.length === 0) {
      return NextResponse.json({ error: "No prompts found" }, { status: 400 });
    }

    const { data: competitors } = await supabaseAdmin
      .from("competitors")
      .select("id, brand_name, url")
      .eq("domain_id", domainId);

    const compList = competitors ?? [];
    const now = Date.now();
    let inserted = 0;

    for (let day = DAYS; day >= 1; day--) {
      const scanDate = new Date(now - day * 24 * 60 * 60 * 1000);
      scanDate.setHours(9, rand(0, 59), rand(0, 59));
      const scannedAt = scanDate.toISOString();

      const mentionProbability = 0.3 + (DAYS - day) * 0.04;

      for (const prompt of prompts) {
        const scanRows = [];
        const compRows = [];

        for (const engine of ENGINES) {
          const mentioned = Math.random() < mentionProbability;
          const position = mentioned ? rand(1, 7) : null;
          const sentiment = mentioned ? pick(SENTIMENTS) : null;
          const response = generateMockResponse(domain.brand_name, mentioned, position);

          scanRows.push({
            domain_id: domainId,
            prompt_id: prompt.id,
            ai_engine: engine,
            run_index: 0,
            response,
            brand_mentioned: mentioned,
            position,
            sentiment,
            citations: [],
            scanned_at: scannedAt,
          });

          for (const comp of compList) {
            const compMentioned = Math.random() < 0.5;
            compRows.push({
              competitor_id: comp.id,
              prompt_id: prompt.id,
              ai_engine: engine,
              run_index: 0,
              brand_mentioned: compMentioned,
              mention_count: compMentioned ? rand(1, 3) : 0,
              position: compMentioned ? rand(1, 7) : null,
              scanned_at: scannedAt,
            });
          }
        }

        await supabaseAdmin.from("scan_results").insert(scanRows);
        inserted += scanRows.length;

        if (compRows.length > 0) {
          await supabaseAdmin.from("competitor_scan_results").insert(compRows);
        }
      }
    }

    await supabaseAdmin
      .from("domains")
      .update({ first_scan_done: true, scan_status: "completed" })
      .eq("id", domainId);

    return NextResponse.json({
      success: true,
      inserted,
      days: DAYS,
      prompts: prompts.length,
      engines: ENGINES.length,
    });
  } catch (err) {
    console.error("[DemoSeed] Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Seed failed" },
      { status: 500 }
    );
  }
}
