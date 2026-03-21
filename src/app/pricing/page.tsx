import Image from "next/image";
import { getAuthUser } from "@/lib/auth";
import { SiteHeader } from "@/components/marketing/site-header";
import { SquishyPricing } from "@/components/ui/squishy-pricing";
import { Check } from "lucide-react";

export default async function PricingPage() {
  const user = await getAuthUser();

  return (
    <div className="min-h-screen bg-background pt-16">
      <SiteHeader authenticated={!!user} />

      <SquishyPricing />

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
              "Competitor tracking",
              "Mention rate & position tracking",
              "Daily trend analytics",
              "Multi-language support",
              "Prompt-level breakdown",
              "Email reports",
              "Priority support",
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
                q: "What is a prompt?",
                a: "A prompt is a search query that we send to AI engines on your behalf. For example, \"What is the best resume builder?\" is one prompt. Each prompt is scanned across all 7 AI engines daily.",
              },
              {
                q: "Can I change my plan later?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
              },
              {
                q: "What AI engines do you support?",
                a: "We scan ChatGPT, Google Gemini, Anthropic Claude, Perplexity, DeepSeek, Grok (xAI), and Mistral — covering over 95% of the AI search market.",
              },
              {
                q: "How often are scans performed?",
                a: "Every plan includes daily automated scans. Your prompts are sent to all 7 engines once per day, and results are tracked over time.",
              },
              {
                q: "Is there a free plan?",
                a: "Yes! We offer a permanent Free plan with 3 prompts scanned daily across all 7 AI engines. No credit card required — sign up and start tracking your AI visibility right away.",
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
