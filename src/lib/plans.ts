export const PLAN_LIMITS: Record<string, number> = {
  starter: 15,
  growth: 30,
  pro: 50,
};

export const DAILY_ARTICLE_LIMITS: Record<string, number> = {
  starter: 1,
  growth: 2,
  pro: 3,
};

export const GAP_ARTICLE_LIMITS: Record<string, number> = {
  starter: 15,
  growth: 30,
  pro: 50,
};

export const ARTICLE_LIMITS: Record<string, number> = {
  starter: 30,
  growth: 60,
  pro: 90,
};

export type PriceTier = "early1" | "early2" | "normal";

export const PLAN_PRICES: Record<string, Record<PriceTier, number>> = {
  starter: { early1: 99, early2: 149, normal: 199 },
  growth: { early1: 199, early2: 289, normal: 399 },
  pro: { early1: 349, early2: 479, normal: 649 },
};

export const PLAN_PRODUCT_IDS: Record<string, string> = {
  starter_early1: "POLAR_STARTER_EARLY1_ID",
  starter_early2: "POLAR_STARTER_EARLY2_ID",
  starter_normal: "POLAR_STARTER_NORMAL_ID",
  growth_early1: "POLAR_GROWTH_EARLY1_ID",
  growth_early2: "POLAR_GROWTH_EARLY2_ID",
  growth_normal: "POLAR_GROWTH_NORMAL_ID",
  pro_early1: "POLAR_PRO_EARLY1_ID",
  pro_early2: "POLAR_PRO_EARLY2_ID",
  pro_normal: "POLAR_PRO_NORMAL_ID",
};

export const PRODUCT_ID_TO_PLAN: Record<string, string> = {};
for (const [key, id] of Object.entries(PLAN_PRODUCT_IDS)) {
  const plan = key.split("_")[0];
  PRODUCT_ID_TO_PLAN[id] = plan;
}

export const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
};

export const PLAN_ORDER = ["starter", "growth", "pro"] as const;

export function getPriceTier(customerCount: number): PriceTier {
  if (customerCount <= 89) return "early1";
  if (customerCount <= 200) return "early2";
  return "normal";
}

export function getPriceForPlan(plan: string, tier: PriceTier): number {
  return PLAN_PRICES[plan]?.[tier] ?? PLAN_PRICES.starter.normal;
}

export function getProductIdForPlan(plan: string, tier: PriceTier): string {
  return PLAN_PRODUCT_IDS[`${plan}_${tier}`] ?? "";
}

export function getPromptLimit(plan: string): number {
  return PLAN_LIMITS[plan] ?? 15;
}

export function getDailyArticleLimit(plan: string): number {
  return DAILY_ARTICLE_LIMITS[plan] ?? 1;
}

export function getGapArticleLimit(plan: string): number {
  return GAP_ARTICLE_LIMITS[plan] ?? 5;
}

export function getArticleLimit(plan: string): number {
  return ARTICLE_LIMITS[plan] ?? 30;
}

export function getPlanByProductId(productId: string): string {
  return PRODUCT_ID_TO_PLAN[productId] ?? "starter";
}

// --- Prompt Add-on Subscriptions ---

export const PROMPT_ADDON_TIERS = {
  addon_50:  { count: 50,  price: 39,  label: "50 Extra Prompts" },
  addon_100: { count: 100, price: 69,  label: "100 Extra Prompts" },
  addon_250: { count: 250, price: 149, label: "250 Extra Prompts" },
} as const;

export type AddonTierKey = keyof typeof PROMPT_ADDON_TIERS;

export const ADDON_TIER_ORDER: AddonTierKey[] = ["addon_50", "addon_100", "addon_250"];

export const ADDON_PRODUCT_IDS: Record<string, string> = {
  addon_50:  "POLAR_ADDON_50_ID",
  addon_100: "POLAR_ADDON_100_ID",
  addon_250: "POLAR_ADDON_250_ID",
};

export const ADDON_PRODUCT_ID_TO_TIER: Record<string, AddonTierKey> = {};
for (const [tier, productId] of Object.entries(ADDON_PRODUCT_IDS)) {
  ADDON_PRODUCT_ID_TO_TIER[productId] = tier as AddonTierKey;
}

export function getAddonTierByProductId(productId: string): AddonTierKey | null {
  return ADDON_PRODUCT_ID_TO_TIER[productId] ?? null;
}

export function isAddonProductId(productId: string): boolean {
  return productId in ADDON_PRODUCT_ID_TO_TIER;
}
