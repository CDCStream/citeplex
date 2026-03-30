import { supabaseAdmin } from "@/lib/supabase/server";
import { getPromptLimit } from "@/lib/plans";

export async function getAddonPromptCount(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("prompt_addon_subscriptions")
    .select("prompt_count")
    .eq("user_id", userId)
    .eq("status", "active");

  return (data ?? []).reduce((sum, row) => sum + row.prompt_count, 0);
}

export async function getEffectivePromptLimit(
  userId: string,
  basePlan: string,
): Promise<number> {
  const baseLimit = getPromptLimit(basePlan);
  const addonTotal = await getAddonPromptCount(userId);
  return baseLimit + addonTotal;
}
