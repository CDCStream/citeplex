"use server";

import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { runSinglePromptScan } from "@/lib/scan/scan-service";
import { analyzePrompt } from "@/lib/ai-engines/detect-language";
import { logActivity } from "@/lib/activity-logger";
import { getPromptLimit } from "@/lib/plans";

export async function createPrompt(domainId: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const plan = user.plan || "starter";
  const limit = getPromptLimit(plan);

  const { data: userDomains } = await supabaseAdmin
    .from("domains")
    .select("id")
    .eq("user_id", user.id);
  const domainIds = userDomains?.map((d) => d.id) || [];

  if (domainIds.length > 0) {
    const { count } = await supabaseAdmin
      .from("prompts")
      .select("id", { count: "exact", head: true })
      .in("domain_id", domainIds);
    if ((count || 0) >= limit) {
      throw new Error(`Prompt limit reached (${limit}). Upgrade your plan to add more prompts.`);
    }
  }

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("*")
    .eq("id", domainId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!domain) throw new Error("Domain not found");

  const text = formData.get("text") as string;

  if (!text) throw new Error("Prompt text is required");

  const analysis = await analyzePrompt(text.trim());

  const { data: prompt, error } = await supabaseAdmin
    .from("prompts")
    .insert({
      domain_id: domainId,
      text: text.trim(),
      category: analysis.category,
      language: analysis.language,
      country: analysis.country,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  logActivity({ userId: user.id, action: "prompt.create", resourceType: "prompt", resourceId: prompt.id, metadata: { text: prompt.text, domain_id: domainId } });

  revalidatePath(`/dashboard/${domainId}/prompts`);
  revalidatePath(`/dashboard/${domainId}/ai-visibility`);

  runSinglePromptScan(domainId, prompt.id).catch((err) => {
    console.error("Auto-scan for new prompt failed:", err);
  });
}

export async function deletePrompt(promptId: string, domainId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const { data: prompt } = await supabaseAdmin
    .from("prompts")
    .select("*")
    .eq("id", promptId)
    .maybeSingle();
  if (!prompt) throw new Error("Prompt not found");

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("user_id")
    .eq("id", prompt.domain_id)
    .single();
  if (!domain || domain.user_id !== user.id) throw new Error("Prompt not found");

  await supabaseAdmin.from("prompts").delete().eq("id", promptId);

  logActivity({ userId: user.id, action: "prompt.delete", resourceType: "prompt", resourceId: promptId, metadata: { text: prompt.text, domain_id: domainId } });

  revalidatePath(`/dashboard/${domainId}/prompts`);
  revalidatePath(`/dashboard/${domainId}/ai-visibility`);
}

export async function togglePrompt(promptId: string, domainId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const { data: prompt } = await supabaseAdmin
    .from("prompts")
    .select("*")
    .eq("id", promptId)
    .maybeSingle();
  if (!prompt) throw new Error("Prompt not found");

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("user_id")
    .eq("id", prompt.domain_id)
    .single();
  if (!domain || domain.user_id !== user.id) throw new Error("Prompt not found");

  await supabaseAdmin
    .from("prompts")
    .update({ is_active: !prompt.is_active })
    .eq("id", promptId);

  logActivity({ userId: user.id, action: "prompt.toggle", resourceType: "prompt", resourceId: promptId, metadata: { is_active: !prompt.is_active, domain_id: domainId } });

  revalidatePath(`/dashboard/${domainId}/prompts`);
  revalidatePath(`/dashboard/${domainId}/ai-visibility`);
}
