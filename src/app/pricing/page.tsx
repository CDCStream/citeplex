import Image from "next/image";
import { getAuthUser } from "@/lib/auth";
import { SiteHeader } from "@/components/marketing/site-header";
import { SquishyPricing } from "@/components/ui/squishy-pricing";
import { Check } from "lucide-react";
import { getSeatsRemaining } from "@/lib/customer-count";
import { PLAN_PRODUCT_IDS } from "@/lib/plans";

export default async function PricingPage() {
  const user = await getAuthUser();
  const { tier, seatsLeft } = await getSeatsRemaining();

  return (
    <div className="min-h-screen bg-background pt-16">
      <SiteHeader authenticated={!!user} />

      <SquishyPricing tier={tier} seatsLeft={seatsLeft} productIds={PLAN_PRODUCT_IDS} />

      {/* All Plans Include */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <h3 className="text-center text-2xl font-bold mb-10">
            Every plan includes
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Daily automated scans",
              "7 AI engines (ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok, Mistral)",
              "Competitor tracking & gap analysis",
              "Mention rate & position tracking",
              "Sentiment analysis & AI insights",
              "Keyword research (Ahrefs powered)",
              "AI article writer with SEO scoring",
              "Multi-platform publishing",
              "14-day free trial",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 rounded-xl border bg-card p-4"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h3 className="text-center text-2xl font-bold mb-10">
            Frequently asked questions
          </h3>
          <div className="space-y-6">
            {[
              {
                q: "What is included in each plan?",
                a: "Every plan is an all-in-one bundle: AI Visibility tracking (prompts scanned daily across 7 engines), scheduled article writing, and competitor gap analysis articles. Plans differ in volume.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes! All plans come with a 14-day free trial. No credit card required to start.",
              },
              {
                q: "Can I upgrade my plan later?",
                a: "Absolutely. You can upgrade anytime from your dashboard. You only pay the prorated difference for the remaining billing period.",
              },
              {
                q: "What AI engines do you support?",
                a: "We scan ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok, and Mistral. That covers most of the AI search market.",
              },
              {
                q: "What is an early bird price?",
                a: "We offer discounted pricing for our first 200 customers. The first 100 customers get the best rate, and customers 101-200 get a moderate discount. After that, normal pricing applies.",
              },
            ].map((item) => (
              <div key={item.q} className="rounded-xl border bg-card p-6">
                <h4 className="font-semibold">{item.q}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 sm:px-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Citeplex" width={24} height={24} />
            <span className="text-sm font-bold">
              <span className="text-primary">Cite</span>plex
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Citeplex. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
