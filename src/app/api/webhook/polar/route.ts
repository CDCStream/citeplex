import { Webhooks } from "@polar-sh/nextjs";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  getPlanByProductId,
  PLAN_PRICES,
  getPriceTier,
  isAddonProductId,
  getAddonTierByProductId,
  PROMPT_ADDON_TIERS,
  type AddonTierKey,
} from "@/lib/plans";
import { getPayingCustomerCount } from "@/lib/customer-count";

async function getUserByEmail(email: string) {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();
  return data;
}

async function recordBillingEvent({
  userId,
  type,
  plan,
  amount,
  status = "completed",
  polarSubscriptionId,
  polarCustomerId,
  description,
  metadata,
}: {
  userId: string | null;
  type: string;
  plan: string;
  amount: number;
  status?: string;
  polarSubscriptionId?: string;
  polarCustomerId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("billing_history").insert({
    user_id: userId,
    type,
    plan,
    amount,
    currency: "usd",
    status,
    polar_subscription_id: polarSubscriptionId,
    polar_customer_id: polarCustomerId,
    description,
    metadata: metadata ?? {},
  });

  if (error) {
    console.error("[Polar Webhook] Failed to record billing event:", error);
  }
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    console.log("[Polar Webhook]", payload.type);
  },
  onSubscriptionCreated: async (data) => {
    const email = data.data.customer?.email;
    const productId = data.data.product?.id;

    if (!email || !productId) return;

    const user = await getUserByEmail(email);

    if (isAddonProductId(productId)) {
      const addonTier = getAddonTierByProductId(productId)!;
      const config = PROMPT_ADDON_TIERS[addonTier];

      if (user) {
        await supabaseAdmin.from("prompt_addon_subscriptions").insert({
          user_id: user.id,
          tier: addonTier,
          prompt_count: config.count,
          status: "active",
          polar_subscription_id: data.data.id,
          polar_customer_id: data.data.customer?.id,
        });
        console.log(`[Polar Webhook] ${email} added prompt addon: ${addonTier} (+${config.count})`);
      }

      await recordBillingEvent({
        userId: user?.id ?? null,
        type: "addon_created",
        plan: addonTier,
        amount: (data.data.amount ?? config.prices.normal * 100),
        polarSubscriptionId: data.data.id,
        polarCustomerId: data.data.customer?.id,
        description: `Added ${config.label}`,
        metadata: { email, product_id: productId, addon_tier: addonTier },
      });
      return;
    }

    const plan = getPlanByProductId(productId);
    if (!plan) {
      console.error(`[Polar Webhook] Unknown product ID: ${productId}`);
      return;
    }

    const customerCount = await getPayingCustomerCount();
    const tier = getPriceTier(customerCount);
    const price = PLAN_PRICES[plan]?.[tier] ?? 0;

    const { error } = await supabaseAdmin
      .from("users")
      .update({ plan })
      .eq("email", email);

    if (error) {
      console.error("[Polar Webhook] Failed to update plan:", error);
    } else {
      console.log(`[Polar Webhook] ${email} upgraded to ${plan}`);
    }

    await recordBillingEvent({
      userId: user?.id ?? null,
      type: "subscription_created",
      plan,
      amount: price * 100,
      polarSubscriptionId: data.data.id,
      polarCustomerId: data.data.customer?.id,
      description: `Subscribed to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`,
      metadata: {
        email,
        product_id: productId,
        subscription_id: data.data.id,
        tier,
      },
    });
  },
  onSubscriptionUpdated: async (data) => {
    const email = data.data.customer?.email;
    const productId = data.data.product?.id;
    const status = data.data.status;

    if (!email || !productId) return;

    const user = await getUserByEmail(email);

    if (isAddonProductId(productId)) {
      const addonTier = getAddonTierByProductId(productId)!;
      const config = PROMPT_ADDON_TIERS[addonTier];

      if (status === "canceled" || status === "revoked") {
        await supabaseAdmin
          .from("prompt_addon_subscriptions")
          .update({ status: "canceled", canceled_at: new Date().toISOString() })
          .eq("polar_subscription_id", data.data.id);
        console.log(`[Polar Webhook] ${email} addon ${addonTier} ${status}`);

        await recordBillingEvent({
          userId: user?.id ?? null,
          type: "addon_canceled",
          plan: addonTier,
          amount: 0,
          status,
          polarSubscriptionId: data.data.id,
          polarCustomerId: data.data.customer?.id,
          description: `${config.label} canceled`,
          metadata: { email, product_id: productId, addon_tier: addonTier },
        });
      }
      return;
    }

    if (status === "canceled" || status === "revoked") {
      await supabaseAdmin
        .from("users")
        .update({ plan: null })
        .eq("email", email);
      console.log(`[Polar Webhook] ${email} subscription ${status}`);

      await recordBillingEvent({
        userId: user?.id ?? null,
        type: "subscription_canceled",
        plan: "none",
        amount: 0,
        status: status,
        polarSubscriptionId: data.data.id,
        polarCustomerId: data.data.customer?.id,
        description: `Subscription ${status}`,
        metadata: {
          email,
          product_id: productId,
          previous_status: status,
        },
      });
      return;
    }

    if (status !== "active") {
      console.log(`[Polar Webhook] Skipping plan sync for non-active status: ${status}`);
      return;
    }

    const plan = getPlanByProductId(productId);
    if (!plan) {
      console.error(`[Polar Webhook] Unknown product ID on update: ${productId}`);
      return;
    }

    const customerCount = await getPayingCustomerCount();
    const tier = getPriceTier(customerCount);
    const price = PLAN_PRICES[plan]?.[tier] ?? 0;

    await supabaseAdmin
      .from("users")
      .update({ plan })
      .eq("email", email);
    console.log(`[Polar Webhook] ${email} plan updated to ${plan}`);

    await recordBillingEvent({
      userId: user?.id ?? null,
      type: "subscription_updated",
      plan,
      amount: price * 100,
      polarSubscriptionId: data.data.id,
      polarCustomerId: data.data.customer?.id,
      description: `Plan changed to ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
      metadata: {
        email,
        product_id: productId,
        subscription_id: data.data.id,
        tier,
      },
    });
  },
  onSubscriptionCanceled: async (data) => {
    const email = data.data.customer?.email;
    const productId = data.data.product?.id;
    if (!email || !productId) return;

    const user = await getUserByEmail(email);

    if (isAddonProductId(productId)) {
      const addonTier = getAddonTierByProductId(productId)!;
      const config = PROMPT_ADDON_TIERS[addonTier];
      await supabaseAdmin
        .from("prompt_addon_subscriptions")
        .update({ status: "canceled", canceled_at: new Date().toISOString() })
        .eq("polar_subscription_id", data.data.id);
      console.log(`[Polar Webhook] ${email} addon ${addonTier} canceled (dedicated event)`);

      await recordBillingEvent({
        userId: user?.id ?? null,
        type: "addon_canceled",
        plan: addonTier,
        amount: 0,
        status: "canceled",
        polarSubscriptionId: data.data.id,
        polarCustomerId: data.data.customer?.id,
        description: `${config.label} canceled`,
        metadata: { email, product_id: productId, addon_tier: addonTier },
      });
      return;
    }

    await supabaseAdmin
      .from("users")
      .update({ plan: null })
      .eq("email", email);
    console.log(`[Polar Webhook] ${email} subscription canceled (dedicated event)`);

    await recordBillingEvent({
      userId: user?.id ?? null,
      type: "subscription_canceled",
      plan: "none",
      amount: 0,
      status: "canceled",
      polarSubscriptionId: data.data.id,
      polarCustomerId: data.data.customer?.id,
      description: "Subscription canceled",
      metadata: { email, product_id: productId },
    });
  },
  onSubscriptionRevoked: async (data) => {
    const email = data.data.customer?.email;
    const productId = data.data.product?.id;
    if (!email || !productId) return;

    const user = await getUserByEmail(email);

    if (isAddonProductId(productId)) {
      const addonTier = getAddonTierByProductId(productId)!;
      const config = PROMPT_ADDON_TIERS[addonTier];
      await supabaseAdmin
        .from("prompt_addon_subscriptions")
        .update({ status: "canceled", canceled_at: new Date().toISOString() })
        .eq("polar_subscription_id", data.data.id);
      console.log(`[Polar Webhook] ${email} addon ${addonTier} revoked`);

      await recordBillingEvent({
        userId: user?.id ?? null,
        type: "addon_revoked",
        plan: addonTier,
        amount: 0,
        status: "revoked",
        polarSubscriptionId: data.data.id,
        polarCustomerId: data.data.customer?.id,
        description: `${config.label} revoked`,
        metadata: { email, product_id: productId, addon_tier: addonTier },
      });
      return;
    }

    await supabaseAdmin
      .from("users")
      .update({ plan: null })
      .eq("email", email);
    console.log(`[Polar Webhook] ${email} subscription revoked`);

    await recordBillingEvent({
      userId: user?.id ?? null,
      type: "subscription_revoked",
      plan: "none",
      amount: 0,
      status: "revoked",
      polarSubscriptionId: data.data.id,
      polarCustomerId: data.data.customer?.id,
      description: "Subscription revoked",
      metadata: { email, product_id: productId },
    });
  },
});
