import { supabaseAdmin } from "@/lib/supabase/server";

export async function checkAndCreateAlerts(domainId: string): Promise<number> {
  const { data: scanRows } = await supabaseAdmin
    .from("scan_results")
    .select("scanned_at, brand_mentioned")
    .eq("domain_id", domainId)
    .order("scanned_at", { ascending: false });

  const scans = scanRows ?? [];
  if (scans.length === 0) return 0;

  const scanDates = scans.map((s) => new Date(s.scanned_at));
  const batches = getDistinctBatches(scanDates);
  if (batches.length < 2) return 0;

  const [latestBatchDate, previousBatchDate] = batches;

  const latestBatchStart = new Date(latestBatchDate.getTime() - 60 * 60 * 1000);
  const previousBatchStart = new Date(previousBatchDate.getTime() - 60 * 60 * 1000);

  const latestResults = scans.filter((s) => {
    const d = new Date(s.scanned_at);
    return d >= latestBatchStart && d <= latestBatchDate;
  });
  const previousResults = scans.filter((s) => {
    const d = new Date(s.scanned_at);
    return d >= previousBatchStart && d <= previousBatchDate;
  });

  if (latestResults.length === 0 || previousResults.length === 0) return 0;

  const latestMentionRate = latestResults.filter((r) => r.brand_mentioned).length / latestResults.length;
  const previousMentionRate = previousResults.filter((r) => r.brand_mentioned).length / previousResults.length;

  let alertsCreated = 0;

  const drop = previousMentionRate - latestMentionRate;
  if (drop >= 0.15) {
    await supabaseAdmin.from("alerts").insert({
      domain_id: domainId,
      type: "mention_drop",
      message: `Mention rate dropped by ${Math.round(drop * 100)}% (${Math.round(previousMentionRate * 100)}% → ${Math.round(latestMentionRate * 100)}%). Check which prompts lost visibility.`,
    });
    alertsCreated++;
  }

  const { data: competitorRows } = await supabaseAdmin
    .from("competitors")
    .select("id, brand_name")
    .eq("domain_id", domainId);

  const competitors = competitorRows ?? [];

  for (const comp of competitors) {
    const { data: compLatestRows } = await supabaseAdmin
      .from("competitor_scan_results")
      .select("brand_mentioned")
      .eq("competitor_id", comp.id)
      .gte("scanned_at", latestBatchStart.toISOString());

    const { data: compPreviousRows } = await supabaseAdmin
      .from("competitor_scan_results")
      .select("brand_mentioned")
      .eq("competitor_id", comp.id)
      .gte("scanned_at", previousBatchStart.toISOString())
      .lt("scanned_at", latestBatchStart.toISOString());

    const compLatest = compLatestRows ?? [];
    const compPrevious = compPreviousRows ?? [];

    if (compLatest.length === 0 || compPrevious.length === 0) continue;

    const latestRate = compLatest.filter((r) => r.brand_mentioned).length / compLatest.length;
    const prevRate = compPrevious.filter((r) => r.brand_mentioned).length / compPrevious.length;

    if (latestRate - prevRate >= 0.2) {
      await supabaseAdmin.from("alerts").insert({
        domain_id: domainId,
        type: "competitor_rise",
        message: `${comp.brand_name} gained significant visibility — mention rate increased by ${Math.round((latestRate - prevRate) * 100)}%.`,
      });
      alertsCreated++;
    }
  }

  return alertsCreated;
}

function getDistinctBatches(dates: Date[]): Date[] {
  if (dates.length === 0) return [];
  const sorted = [...dates].sort((a, b) => b.getTime() - a.getTime());

  const batches: Date[] = [sorted[0]];
  for (const d of sorted) {
    const lastBatch = batches[batches.length - 1];
    if (lastBatch.getTime() - d.getTime() > 60 * 60 * 1000) {
      batches.push(d);
      if (batches.length >= 2) break;
    }
  }
  return batches;
}
