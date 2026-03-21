export const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  starter: 15,
  growth: 30,
  pro: 50,
  business: 100,
  enterprise: 250,
};

export const PLAN_PRODUCT_IDS: Record<string, string> = {
  starter: "8c1cef75-3105-4d35-8325-9386b6a9810a",
  growth: "c6fed737-e41c-4cee-9178-48db10b459ec",
  pro: "70cf4a29-3f8f-4b45-883f-c91537c77b17",
  business: "72149761-6178-4bdc-a3ff-1330808d26df",
  enterprise: "51ec99ad-6a9b-45c5-a332-0f18e682233e",
};

export const PRODUCT_ID_TO_PLAN: Record<string, string> = Object.fromEntries(
  Object.entries(PLAN_PRODUCT_IDS).map(([plan, id]) => [id, plan])
);

export const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 20,
  growth: 39,
  pro: 59,
  business: 99,
  enterprise: 249,
};

export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

export function getPromptLimit(plan: string): number {
  return PLAN_LIMITS[plan] ?? 3;
}

export function getPlanByProductId(productId: string): string {
  return PRODUCT_ID_TO_PLAN[productId] ?? "free";
}
