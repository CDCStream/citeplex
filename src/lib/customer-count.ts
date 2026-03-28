import { supabaseAdmin } from "@/lib/supabase/server";
import { getPriceTier, type PriceTier } from "@/lib/plans";

let cachedCount: number | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getPayingCustomerCount(): Promise<number> {
  const now = Date.now();
  if (cachedCount !== null && now - cachedAt < CACHE_TTL_MS) {
    return cachedCount;
  }

  const { count, error } = await supabaseAdmin
    .from("users")
    .select("id", { count: "exact", head: true })
    .neq("plan", "free")
    .not("plan", "is", null);

  if (error) {
    console.error("[CustomerCount] Failed to query:", error);
    return cachedCount ?? 0;
  }

  cachedCount = count ?? 0;
  cachedAt = now;
  return cachedCount;
}

export async function getCurrentPriceTier(): Promise<PriceTier> {
  const count = await getPayingCustomerCount();
  return getPriceTier(count);
}

export async function getSeatsRemaining(): Promise<{ tier: PriceTier; seatsLeft: number }> {
  const count = await getPayingCustomerCount();
  const tier = getPriceTier(count);

  if (tier === "early1") return { tier, seatsLeft: 89 - count };
  if (tier === "early2") return { tier, seatsLeft: 200 - count };
  return { tier, seatsLeft: 0 };
}
