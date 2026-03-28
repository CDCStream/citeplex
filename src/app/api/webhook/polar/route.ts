import { Webhooks } from "@polar-sh/nextjs";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getPlanByProductId, PLAN_PRICES, getPriceTier } from "@/lib/plans";
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

    const plan = getPlanByProductId(productId);
    const user = await getUserByEmail(email);
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

    const plan = getPlanByProductId(productId);
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
});
