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
  starter: { early1: 69, early2: 79, normal: 89 },
  growth: { early1: 135, early2: 155, normal: 179 },
  pro: { early1: 209, early2: 239, normal: 279 },
};

export const PLAN_RETAIL_PRICES: Record<string, number> = {
  starter: 139,
  growth: 269,
  pro: 419,
};

export const PLAN_PRODUCT_IDS: Record<string, string> = {
  starter_early1: "600d46d7-4cda-4d13-80b9-6eca771753ae",
  starter_early2: "60d5b674-0fdb-442a-9c4d-6ed60c44fb73",
  starter_normal: "fe9f50ff-695b-4529-9e10-26e054b7f297",
  growth_early1: "745b2528-acf4-429e-a591-806d5fe73a33",
  growth_early2: "1795ac37-9f64-44d4-9193-a1d1e28d2d6c",
  growth_normal: "d25337e9-1582-41e5-99e5-148b45b86762",
  pro_early1: "14954af3-6941-4024-a48e-e5bf8cbf617f",
  pro_early2: "b5a5f52e-2eb3-4924-99ad-ef78d33d940f",
  pro_normal: "bf79c2b2-ea11-48a1-b3a1-cc33a7431d0d",
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

export function getPromptLimit(plan: string | null): number {
  if (!plan) return 0;
  return PLAN_LIMITS[plan] ?? 0;
}

export const PLAN_BATCH_CONFIG: Record<string, { batches: number; daysPerBatch: number }> = {
  starter: { batches: 3, daysPerBatch: 10 },
  growth:  { batches: 5, daysPerBatch: 6 },
  pro:     { batches: 10, daysPerBatch: 3 },
};

export function getDailyArticleLimit(plan: string | null): number {
  if (!plan) return 0;
  return DAILY_ARTICLE_LIMITS[plan] ?? 0;
}

export function getBatchConfig(plan: string) {
  return PLAN_BATCH_CONFIG[plan] ?? PLAN_BATCH_CONFIG.starter;
}

export function getGapArticleLimit(plan: string | null): number {
  if (!plan) return 0;
  return GAP_ARTICLE_LIMITS[plan] ?? 0;
}

export function getArticleLimit(plan: string | null): number {
  if (!plan) return 0;
  return ARTICLE_LIMITS[plan] ?? 0;
}

export function getPlanByProductId(productId: string): string | null {
  return PRODUCT_ID_TO_PLAN[productId] ?? null;
}

// --- Prompt Add-on Subscriptions ---

export const PROMPT_ADDON_TIERS = {
  addon_50:  { count: 50,  gapArticles: 50,  prices: { early1: 99, early2: 109, normal: 129 }, label: "50 Pack" },
  addon_100: { count: 100, gapArticles: 100, prices: { early1: 199, early2: 225, normal: 265 }, label: "100 Pack" },
  addon_200: { count: 200, gapArticles: 200, prices: { early1: 399, early2: 449, normal: 529 }, label: "200 Pack" },
} as const;

export type AddonTierKey = keyof typeof PROMPT_ADDON_TIERS;

export const ADDON_TIER_ORDER: AddonTierKey[] = ["addon_50", "addon_100", "addon_200"];

export const ADDON_PRODUCT_IDS: Record<string, string> = {
  addon_50_early1:  "7b13bff1-eb5e-4f14-a33b-86a14513de11",
  addon_50_early2:  "1e46c899-659f-41fc-aa27-357d78a5de75",
  addon_50_normal:  "de855319-bef4-48e0-a0ba-0c9ded7022bb",
  addon_100_early1: "291cce7d-70ff-4f17-b4af-a418119222b8",
  addon_100_early2: "cab4b432-f4fa-4bca-b9bb-7ab00be77271",
  addon_100_normal: "5b7e032e-1bf8-408b-81c0-af61ff01b55c",
  addon_200_early1: "7e477d3a-f7b3-4ff1-a36f-02365c129d1b",
  addon_200_early2: "24f877ec-0d0e-42a3-93a5-b6ccf87779cb",
  addon_200_normal: "7d16e9ae-dfee-4cb3-94ed-d44600562675",
};

export function getAddonProductId(tierKey: AddonTierKey, priceTier: PriceTier): string {
  return ADDON_PRODUCT_IDS[`${tierKey}_${priceTier}`] ?? "";
}

export const ADDON_PRODUCT_ID_TO_TIER: Record<string, AddonTierKey> = {};
for (const [key, productId] of Object.entries(ADDON_PRODUCT_IDS)) {
  const addonTier = key.replace(/_early1$|_early2$|_normal$/, "") as AddonTierKey;
  ADDON_PRODUCT_ID_TO_TIER[productId] = addonTier;
}

export function getAddonTierByProductId(productId: string): AddonTierKey | null {
  return ADDON_PRODUCT_ID_TO_TIER[productId] ?? null;
}

export function isAddonProductId(productId: string): boolean {
  return productId in ADDON_PRODUCT_ID_TO_TIER;
}
