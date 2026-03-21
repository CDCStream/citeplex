import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { runDomainScan } from "@/lib/scan/scan-service";
import { checkAndCreateAlerts } from "@/lib/alerts/check-alerts";
import { logActivity } from "@/lib/activity-logger";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

    const results: { domainId: string; brand: string; status: string }[] = [];

    for (const domain of domains || []) {
      try {
        logActivity({ action: "scan.cron", resourceType: "domain", resourceId: domain.id, metadata: { brand_name: domain.brand_name } });
        await runDomainScan(domain.id);
        await checkAndCreateAlerts(domain.id).catch(() => 0);
        results.push({ domainId: domain.id, brand: domain.brand_name, status: "ok" });
      } catch (err) {
        results.push({
          domainId: domain.id,
          brand: domain.brand_name,
          status: `error: ${(err as Error).message}`,
        });
      }
    }

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
