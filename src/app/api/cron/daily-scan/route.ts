import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { runDomainScan } from "@/lib/scan/scan-service";
import { checkAndCreateAlerts } from "@/lib/alerts/check-alerts";
import { logActivity } from "@/lib/activity-logger";

export const maxDuration = 300;

const DOMAIN_CONCURRENCY = 5;
const PER_DOMAIN_TIMEOUT_MS = 250_000; // 250s, leaves 50s buffer for cron overhead

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout after ${ms / 1000}s for ${label}`)),
      ms
    );
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

async function scanDomain(domain: { id: string; brand_name: string }) {
  try {
    logActivity({
      action: "scan.cron",
      resourceType: "domain",
      resourceId: domain.id,
      metadata: { brand_name: domain.brand_name },
    });
    await withTimeout(
      runDomainScan(domain.id),
      PER_DOMAIN_TIMEOUT_MS,
      domain.brand_name
    );
    await checkAndCreateAlerts(domain.id).catch(() => 0);
    return { domainId: domain.id, brand: domain.brand_name, status: "ok" };
  } catch (err) {
    return {
      domainId: domain.id,
      brand: domain.brand_name,
      status: `error: ${(err as Error).message}`,
    };
  }
}

async function runBatched<T>(
  items: (() => Promise<T>)[],
  concurrency: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const settled = await Promise.allSettled(chunk.map((fn) => fn()));
    results.push(...settled);
  }

  return results;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: activePrompts } = await supabaseAdmin
      .from("prompts")
      .select("domain_id")
      .eq("is_active", true);

    const uniqueIds = [...new Set(activePrompts?.map((p) => p.domain_id) || [])];

    if (uniqueIds.length === 0) {
      return NextResponse.json({ success: true, scanned: 0, results: [] });
    }

    const { data: domains } = await supabaseAdmin
      .from("domains")
      .select("*")
      .in("id", uniqueIds);

    const settled = await runBatched(
      (domains || []).map((domain) => () => scanDomain(domain)),
      DOMAIN_CONCURRENCY
    );

    const results = settled.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { domainId: "unknown", brand: "unknown", status: `rejected: ${r.reason}` }
    );

    return NextResponse.json({
      success: true,
      scanned: results.length,
      results,
    });
  } catch (err) {
    console.error("Daily cron error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
