"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { PLAN_PRODUCT_IDS } from "@/lib/plans";

interface PricingTier {
  label: string;
  prompts: number;
  monthlyPrice: string;
  perPrompt: string;
  description: string;
  cta: string;
  href: string;
  background: string;
  popular?: boolean;
  free?: boolean;
  BGComponent: React.FC;
}

const tiers: PricingTier[] = [
  {
    label: "Free",
    prompts: 3,
    monthlyPrice: "0",
    perPrompt: "Free",
    description: "Start for free. No credit card needed.",
    cta: "Sign Up Free",
    href: "/login",
    background: "",
    free: true,
    BGComponent: BGComponentFree,
  },
  {
    label: "Starter",
    prompts: 15,
    monthlyPrice: "20",
    perPrompt: "1.33",
    description: "Great for freelancers and small brands starting out.",
    cta: "Get Started",
    href: `/checkout?products=${PLAN_PRODUCT_IDS.starter}`,
    background: "bg-slate-700 dark:bg-slate-800",
    BGComponent: BGComponent1,
  },
  {
    label: "Growth",
    prompts: 30,
    monthlyPrice: "39",
    perPrompt: "1.30",
    description: "For brands that need wider AI search coverage.",
    cta: "Get Started",
    href: `/checkout?products=${PLAN_PRODUCT_IDS.growth}`,
    background: "bg-indigo-500 dark:bg-indigo-600",
    BGComponent: BGComponent2,
  },
  {
    label: "Pro",
    prompts: 50,
    monthlyPrice: "59",
    perPrompt: "1.18",
    description: "Our most popular plan. Best value for busy teams.",
    cta: "Get Started",
    href: `/checkout?products=${PLAN_PRODUCT_IDS.pro}`,
    background: "bg-blue-600 dark:bg-blue-700",
    popular: true,
    BGComponent: BGComponent3,
  },
  {
    label: "Business",
    prompts: 100,
    monthlyPrice: "99",
    perPrompt: "0.99",
    description: "For teams with many domains and tough markets.",
    cta: "Get Started",
    href: `/checkout?products=${PLAN_PRODUCT_IDS.business}`,
    background: "bg-purple-500 dark:bg-purple-600",
    BGComponent: BGComponent4,
  },
  {
    label: "Enterprise",
    prompts: 250,
    monthlyPrice: "249",
    perPrompt: "1.00",
    description: "Full coverage for agencies and large brands.",
    cta: "Get Started",
    href: `/checkout?products=${PLAN_PRODUCT_IDS.enterprise}`,
    background: "bg-pink-500 dark:bg-pink-600",
    BGComponent: BGComponent5,
  },
];

export function SquishyPricing() {
  return (
    <section className="bg-background px-4 py-20 transition-colors">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Pricing
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Simple, prompt-based pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Pay only for what you track. Each prompt is scanned across all 7 AI
            engines daily — no hidden fees.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {tiers.map((tier) => (
            <PricingCard key={tier.label} tier={tier} />
          ))}
        </div>

        <div className="mt-14 text-center">
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

function PricingCard({ tier }: { tier: PricingTier }) {
  const { label, prompts, monthlyPrice, perPrompt, description, cta, href, background, popular, free, BGComponent } = tier;
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    setLoading(true);
    router.push(href);
  };

  if (free) {
    return (
      <motion.div
        whileHover="hover"
        transition={{ duration: 1, ease: "backInOut" }}
        variants={{ hover: { scale: 1.05 } }}
        className="relative h-[420px] w-56 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-border bg-card p-6 shadow-sm hover:shadow-lg transition-shadow"
      >
        <div className="relative z-10">
          <span className="mb-3 block w-fit rounded-full bg-muted px-3 py-0.5 text-sm font-medium text-foreground border border-border">
            {label}
          </span>
          <motion.div
            initial={{ scale: 0.85 }}
            variants={{ hover: { scale: 1 } }}
            transition={{ duration: 1, ease: "backInOut" }}
            className="my-2 origin-top-left"
          >
            <span className="font-mono text-5xl font-black leading-[1.1] text-foreground">
              ${monthlyPrice}
            </span>
            <span className="text-muted-foreground text-sm font-medium">/mo</span>
          </motion.div>

          <div className="mt-3 mb-4 flex items-center gap-2">
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
              {prompts} prompts
            </span>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <button
          onClick={handleClick}
          disabled={loading}
          className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-center gap-2 rounded-lg border-2 border-primary bg-primary py-2 font-mono text-sm font-black uppercase text-primary-foreground transition-all duration-200 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : cta}
        </button>

        <BGComponent />
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover="hover"
      transition={{ duration: 1, ease: "backInOut" }}
      variants={{ hover: { scale: 1.05 } }}
      className={`relative h-[420px] w-56 shrink-0 overflow-hidden rounded-xl p-6 ${background} shadow-lg hover:shadow-xl transition-shadow`}
    >
      {popular && (
        <div className="absolute top-3 right-3 z-20 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 shadow-md">
          Popular
        </div>
      )}

      <div className="relative z-10 text-white">
        <span className="mb-3 block w-fit rounded-full bg-white/20 backdrop-blur-sm px-3 py-0.5 text-sm font-medium text-white border border-white/20">
          {label}
        </span>
        <motion.div
          initial={{ scale: 0.85 }}
          variants={{ hover: { scale: 1 } }}
          transition={{ duration: 1, ease: "backInOut" }}
          className="my-2 origin-top-left"
        >
          <span className="font-mono text-5xl font-black leading-[1.1]">
            ${monthlyPrice}
          </span>
          <span className="text-white/70 text-sm font-medium">/mo</span>
        </motion.div>

        <div className="mt-3 mb-4 flex items-center gap-2">
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">
            {prompts} prompts
          </span>
          <span className="text-xs text-white/60">
            ${perPrompt}/each
          </span>
        </div>

        <p className="text-sm leading-relaxed text-white/85">{description}</p>
      </div>

      <button
        onClick={handleClick}
        disabled={loading}
        className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-center gap-2 rounded-lg border-2 border-white bg-white py-2 font-mono text-sm font-black uppercase text-neutral-800 backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:text-white hover:border-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : cta}
      </button>

      <BGComponent />
    </motion.div>
  );
}

function BGComponentFree() {
  return (
    <motion.svg
      width="224"
      height="420"
      viewBox="0 0 224 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      variants={{ hover: { scale: 1.4 } }}
      transition={{ duration: 1, ease: "backInOut" }}
      className="absolute inset-0 z-0"
    >
      <motion.circle
        variants={{ hover: { scale: 0.8, y: -20 } }}
        transition={{ delay: 0.2, duration: 1, ease: "backInOut" }}
        cx="112"
        cy="280"
        r="90"
        fill="hsl(var(--primary) / 0.06)"
      />
    </motion.svg>
  );
}

function BGComponent1() {
  return (
    <motion.svg
      width="224"
      height="420"
      viewBox="0 0 224 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      variants={{ hover: { scale: 1.5 } }}
      transition={{ duration: 1, ease: "backInOut" }}
      className="absolute inset-0 z-0"
    >
      <motion.circle
        variants={{ hover: { scaleY: 0.5, y: -25 } }}
        transition={{ duration: 1, ease: "backInOut", delay: 0.2 }}
        cx="112"
        cy="130"
        r="80"
        fill="rgba(255,255,255,0.08)"
      />
      <motion.ellipse
        variants={{ hover: { scaleY: 2.25, y: -25 } }}
        transition={{ duration: 1, ease: "backInOut", delay: 0.2 }}
        cx="112"
        cy="290"
        rx="80"
        ry="35"
        fill="rgba(255,255,255,0.08)"
      />
    </motion.svg>
  );
}

function BGComponent2() {
  return (
    <motion.svg
      width="224"
      height="420"
      viewBox="0 0 224 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      variants={{ hover: { scale: 1.05 } }}
      transition={{ duration: 1, ease: "backInOut" }}
      className="absolute inset-0 z-0"
    >
      <motion.rect
        x="10"
        width="110"
        height="110"
        rx="15"
        fill="rgba(255,255,255,0.08)"
        variants={{ hover: { y: 250, rotate: "90deg", scaleX: 1.8 } }}
        style={{ y: 12 }}
        transition={{ delay: 0.2, duration: 1, ease: "backInOut" }}
      />
      <motion.rect
        x="104"
        width="110"
        height="110"
        rx="15"
        fill="rgba(255,255,255,0.08)"
        variants={{ hover: { y: 12, rotate: "90deg", scaleX: 1.8 } }}
        style={{ y: 250 }}
        transition={{ delay: 0.2, duration: 1, ease: "backInOut" }}
      />
    </motion.svg>
  );
}

function BGComponent3() {
  return (
    <motion.svg
      width="224"
      height="420"
      viewBox="0 0 224 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      variants={{ hover: { scale: 1.25 } }}
      transition={{ duration: 1, ease: "backInOut" }}
      className="absolute inset-0 z-0"
    >
      <motion.path
        variants={{ hover: { y: -50 } }}
        transition={{ delay: 0.3, duration: 1, ease: "backInOut" }}
        d="M92 170C97.858 164.142 107.355 164.142 113.213 170L180 236.787C185.858 242.645 185.858 252.142 180 258L145 293C120 318 80 318 55 293L20 258C14.142 252.142 14.142 242.645 20 236.787L92 170Z"
        fill="rgba(255,255,255,0.08)"
      />
      <motion.path
        variants={{ hover: { y: -50 } }}
        transition={{ delay: 0.2, duration: 1, ease: "backInOut" }}
        d="M92 110C97.858 104.142 107.355 104.142 113.213 110L180 176.787C185.858 182.645 185.858 192.142 180 198L145 233C120 258 80 258 55 233L20 198C14.142 192.142 14.142 182.645 20 176.787L92 110Z"
        fill="rgba(255,255,255,0.08)"
      />
      <motion.path
        variants={{ hover: { y: -50 } }}
        transition={{ delay: 0.1, duration: 1, ease: "backInOut" }}
        d="M92 50C97.858 44.142 107.355 44.142 113.213 50L180 116.787C185.858 122.645 185.858 132.142 180 138L145 173C120 198 80 198 55 173L20 138C14.142 132.142 14.142 122.645 20 116.787L92 50Z"
        fill="rgba(255,255,255,0.08)"
      />
    </motion.svg>
  );
}

function BGComponent4() {
  return (
    <motion.svg
      width="224"
      height="420"
      viewBox="0 0 224 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      variants={{ hover: { scale: 1.15 } }}
      transition={{ duration: 1, ease: "backInOut" }}
      className="absolute inset-0 z-0"
    >
      <motion.polygon
        variants={{ hover: { rotate: 180, y: 30 } }}
        transition={{ delay: 0.15, duration: 1, ease: "backInOut" }}
        points="112,40 200,180 24,180"
        fill="rgba(255,255,255,0.08)"
      />
      <motion.polygon
        variants={{ hover: { rotate: -180, y: -30 } }}
        transition={{ delay: 0.25, duration: 1, ease: "backInOut" }}
        points="112,200 200,340 24,340"
        fill="rgba(255,255,255,0.08)"
      />
    </motion.svg>
  );
}

function BGComponent5() {
  return (
    <motion.svg
      width="224"
      height="420"
      viewBox="0 0 224 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      variants={{ hover: { scale: 1.3 } }}
      transition={{ duration: 1, ease: "backInOut" }}
      className="absolute inset-0 z-0"
    >
      <motion.circle
        variants={{ hover: { x: 30, y: -30, scale: 1.3 } }}
        transition={{ delay: 0.1, duration: 1, ease: "backInOut" }}
        cx="60"
        cy="100"
        r="55"
        fill="rgba(255,255,255,0.07)"
      />
      <motion.circle
        variants={{ hover: { x: -30, y: 30, scale: 1.3 } }}
        transition={{ delay: 0.2, duration: 1, ease: "backInOut" }}
        cx="164"
        cy="200"
        r="65"
        fill="rgba(255,255,255,0.07)"
      />
      <motion.circle
        variants={{ hover: { x: 20, y: -20, scale: 1.2 } }}
        transition={{ delay: 0.3, duration: 1, ease: "backInOut" }}
        cx="90"
        cy="320"
        r="50"
        fill="rgba(255,255,255,0.07)"
      />
    </motion.svg>
  );
}
