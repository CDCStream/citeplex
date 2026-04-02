import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateScanInsights } from "@/lib/insights/generate-scan-insights";

export const maxDuration = 300;

const TIME_BUDGET_MS = 270_000; // stop starting new work after 270s
const DOMAIN_CONCURRENCY = 3;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const { data: domains } = await supabaseAdmin
      .from("domains")
      .select("id, brand_name")
      .eq("first_scan_done", true);

    if (!domains || domains.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    const results: { domainId: string; brand: string; status: string }[] = [];

    for (let i = 0; i < domains.length; i += DOMAIN_CONCURRENCY) {
      if (Date.now() - startTime > TIME_BUDGET_MS) {
        results.push({ domainId: "—", brand: "—", status: "time budget reached, skipping rest" });
        break;
      }

      const chunk = domains.slice(i, i + DOMAIN_CONCURRENCY);
      const settled = await Promise.allSettled(
        chunk.map(async (domain) => {
          try {
            await generateScanInsights(domain.id);
            return { domainId: domain.id, brand: domain.brand_name, status: "ok" };
          } catch (err) {
            return {
              domainId: domain.id,
              brand: domain.brand_name,
              status: `error: ${(err as Error).message}`,
            };
          }
        })
      );

      for (const r of settled) {
        results.push(
          r.status === "fulfilled"
            ? r.value
            : { domainId: "unknown", brand: "unknown", status: `rejected: ${r.reason}` }
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      elapsed_ms: Date.now() - startTime,
      results,
    });
  } catch (err) {
    console.error("Insight cron error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
