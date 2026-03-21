"use server";

import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
type RecommendationStatus = "pending" | "implemented" | "dismissed";

export async function updateRecommendationStatus(
  recId: string,
  domainId: string,
  status: RecommendationStatus
) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const { data: rec } = await supabaseAdmin
    .from("recommendations")
    .select("*")
    .eq("id", recId)
    .maybeSingle();
  if (!rec) throw new Error("Not found");

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("user_id")
    .eq("id", rec.domain_id)
    .single();
  if (!domain || domain.user_id !== user.id) throw new Error("Not found");

  await supabaseAdmin
    .from("recommendations")
    .update({ status })
    .eq("id", recId);

  revalidatePath(`/dashboard/${domainId}/recommendations`);
}
