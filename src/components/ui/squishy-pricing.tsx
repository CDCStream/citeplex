"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Zap, PenLine, Target, Check } from "lucide-react";
import {
  PLAN_PRICES,
  PLAN_LIMITS,
  DAILY_ARTICLE_LIMITS,
  GAP_ARTICLE_LIMITS,
  type PriceTier,
} from "@/lib/plans";

interface SquishyPricingProps {
  tier: PriceTier;
  seatsLeft: number;
  productIds: Record<string, string>;
}

interface PlanDef {
  key: string;
  label: string;
  description: string;
  background: string;
  popular?: boolean;
}

const plans: PlanDef[] = [
  {
    key: "starter",
    label: "Starter",
    description: "Everything you need to start optimizing your AI visibility and content.",
    background: "bg-slate-700 dark:bg-slate-800",
  },
  {
    key: "growth",
    label: "Growth",
    description: "For growing brands that need wider coverage and more content output.",
    background: "bg-blue-600 dark:bg-blue-700",
    popular: true,
  },
  {
    key: "pro",
    label: "Pro",
    description: "Maximum power for agencies and brands dominating their market.",
    background: "bg-indigo-600 dark:bg-indigo-700",
  },
];

export function SquishyPricing({ tier, seatsLeft, productIds }: SquishyPricingProps) {
  return (
    <section className="bg-background px-4 py-20 transition-colors">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Pricing
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            All-in-one SEO, AEO & GEO plans
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            AI Visibility tracking, daily article writing, and competitor gap analysis — bundled in every plan.
          </p>

          {(tier === "early1" || tier === "early2") && seatsLeft > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-5 py-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                Early Bird — {seatsLeft} seats left at this price!
              </span>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.key}
              plan={plan}
              tier={tier}
              productId={productIds[`${plan.key}_${tier}`] || ""}
            />
          ))}
        </div>

        <div className="mt-10 text-center space-y-2">
          <p className="text-sm font-medium text-primary">
            14-day free trial on all plans — no credit card required
          </p>
          <p className="text-sm text-muted-foreground">
            All plans include daily scans across{" "}
            <span className="font-semibold text-foreground">
              ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok & Mistral
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  plan,
  tier,
  productId,
}: {
  plan: PlanDef;
  tier: PriceTier;
  productId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const currentPrice = PLAN_PRICES[plan.key]?.[tier] ?? 0;
  const normalPrice = PLAN_PRICES[plan.key]?.normal ?? 0;
  const isDiscounted = tier !== "normal" && currentPrice < normalPrice;
  const prompts = PLAN_LIMITS[plan.key] ?? 0;
  const dailyArticles = DAILY_ARTICLE_LIMITS[plan.key] ?? 0;
  const gapArticles = GAP_ARTICLE_LIMITS[plan.key] ?? 0;

  const handleClick = () => {
    setLoading(true);
    router.push(`/checkout?products=${productId}`);
  };

  const features = [
    { icon: Target, text: `${prompts} AI Visibility prompts` },
    { icon: PenLine, text: `${dailyArticles} article${dailyArticles > 1 ? "s" : ""}/day (${dailyArticles * 30}/mo)` },
    { icon: Zap, text: `${gapArticles} gap articles/month` },
  ];

  const extras = [
    "Daily scans across 7 AI engines",
    "Brand mention & position tracking",
    "AI Insight Engine (why you rank)",
    "Sentiment analysis (pos/neg/neutral)",
    "Competitor comparison reports",
    "Ahrefs keyword research per article",
    "AI images in every article (DALL-E 3)",
    "YouTube videos embedded in articles",
    "FAQ + JSON-LD schema in articles",
    "High DR backlink exchange",
    "AI visibility gap articles",
    "150+ language support",
    "Multi-platform publishing",
    "SEO scoring & optimization",
    "14-day free trial",
  ];

  return (
    <motion.div
      whileHover="hover"
      transition={{ duration: 0.6, ease: "backInOut" }}
      variants={{ hover: { scale: 1.03 } }}
      className={`relative overflow-hidden rounded-2xl p-7 ${plan.background} shadow-lg hover:shadow-xl transition-shadow flex flex-col`}
    >
      {plan.popular && (
        <div className="absolute top-4 right-4 z-20 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-600 shadow-md">
          Most Popular
        </div>
      )}

      <div className="relative z-10 text-white flex-1 flex flex-col">
        <span className="mb-4 block w-fit rounded-full bg-white/20 backdrop-blur-sm px-3 py-0.5 text-sm font-medium text-white border border-white/20">
          {plan.label}
        </span>

        <div className="mb-1">
          {isDiscounted && (
            <span className="text-white/50 text-lg line-through font-medium mr-2">
              ${normalPrice}
            </span>
          )}
          <span className="font-mono text-5xl font-black leading-[1.1]">
            ${currentPrice}
          </span>
          <span className="text-white/70 text-sm font-medium">/mo</span>
        </div>

        {isDiscounted && (
          <span className="mb-4 inline-block w-fit rounded-full bg-amber-400/20 text-amber-200 px-2.5 py-0.5 text-xs font-semibold">
            Early Bird Price
          </span>
        )}

        <p className="text-sm leading-relaxed text-white/80 mb-6">{plan.description}</p>

        <div className="space-y-3 mb-6">
          {features.map((f) => (
            <div key={f.text} className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <f.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold">{f.text}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-6 flex-1">
          {extras.map((e) => (
            <div key={e} className="flex items-center gap-2 text-white/70">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{e}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-white bg-white py-3 font-mono text-sm font-black uppercase text-neutral-800 backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:text-white hover:border-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Free Trial"}
        </button>
      </div>
    </motion.div>
  );
}
