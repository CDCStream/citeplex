import { supabaseAdmin } from "@/lib/supabase/server";
import { getPromptLimit, getGapArticleLimit, PROMPT_ADDON_TIERS, type AddonTierKey } from "@/lib/plans";

export async function getAddonPromptCount(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("prompt_addon_subscriptions")
    .select("prompt_count")
    .eq("user_id", userId)
    .eq("status", "active");

  return (data ?? []).reduce((sum, row) => sum + row.prompt_count, 0);
}

export async function getAddonGapArticleCount(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("prompt_addon_subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .eq("status", "active");

  return (data ?? []).reduce((sum, row) => {
    const tierConfig = PROMPT_ADDON_TIERS[row.tier as AddonTierKey];
    return sum + (tierConfig?.gapArticles ?? 0);
  }, 0);
}

export async function getEffectivePromptLimit(
  userId: string,
  basePlan: string | null,
): Promise<number> {
  const baseLimit = getPromptLimit(basePlan);
  const addonTotal = await getAddonPromptCount(userId);
  return baseLimit + addonTotal;
}

export async function getEffectiveGapArticleLimit(
  userId: string,
  basePlan: string | null,
): Promise<number> {
  const baseLimit = getGapArticleLimit(basePlan);
  const addonTotal = await getAddonGapArticleCount(userId);
  return baseLimit + addonTotal;
}
