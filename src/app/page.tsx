import Link from "next/link";
import Image from "next/image";
import { getAuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { EngineIcon } from "@/components/ui/engine-icon";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { SquishyPricing } from "@/components/ui/squishy-pricing";
import { CookieSettingsButton } from "@/components/cookie-settings-button";
import {
  Search,
  BarChart3,
  Users,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Eye,
  Target,
} from "lucide-react";

export default async function LandingPage() {
  const user = await getAuthUser();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Citeplex" width={32} height={32} />
            <span className="text-xl font-bold">
              <span className="text-primary">Cite</span>plex
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/login">
                    Get Started
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-40 right-1/4 h-56 w-56 rounded-full bg-blue-400/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16 sm:pb-24 lg:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-extrabold leading-[1.2] tracking-tight sm:text-6xl lg:text-7xl">
              Your brand in the
              <span className="block bg-linear-to-r from-primary via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                age of AI search
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              AI engines are the new search. Track how ChatGPT, Gemini, Claude
              and 4 more talk about your brand — and shape the conversation.
            </p>

            <div className="mt-8">
              <DashboardPreview />
            </div>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="h-13 rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/25" asChild>
                <Link href="/login">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-13 rounded-xl px-8 text-base font-semibold"
                asChild
              >
                <Link href="#how-it-works">
                  How it works
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Engine Marquee */}
          <div className="relative mt-20 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-background to-transparent" />
            <div className="flex animate-marquee gap-4">
              {[
                "ChatGPT",
                "Perplexity",
                "Gemini",
                "Claude",
                "DeepSeek",
                "Grok",
                "Mistral",
                "ChatGPT",
                "Perplexity",
                "Gemini",
                "Claude",
                "DeepSeek",
                "Grok",
                "Mistral",
              ].map((engine, i) => (
                <div
                  key={`${engine}-${i}`}
                  className="flex shrink-0 items-center gap-2.5 rounded-full border bg-card px-5 py-2.5 text-sm font-semibold shadow-sm"
                >
                  <EngineIcon engine={engine.toLowerCase()} size={18} />
                  {engine}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-sm font-semibold tracking-wide text-muted-foreground">
            7 AI Engines · Daily Tracking · <span className="text-primary">Half the Price</span>
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t">
        <SquishyPricing />
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Three steps. Five minutes.
            </h2>
          </div>

          <div className="relative mt-16 grid gap-0 lg:grid-cols-3">
            {/* Connecting line */}
            <div className="absolute top-10 left-[16.67%] right-[16.67%] hidden h-0.5 bg-linear-to-r from-primary/20 via-primary to-primary/20 lg:block" />

            <TimelineStep
              step={1}
              title="Add your brand"
              description="Enter your domain and brand name. We auto-detect your industry and suggest relevant prompts and competitors."
            />
            <TimelineStep
              step={2}
              title="We query AI engines"
              description="Our system sends your prompts to all 7 engines, analyzes responses, and detects brand mentions and positioning."
            />
            <TimelineStep
              step={3}
              title="Track & improve"
              description="See your visibility score, daily trends, competitor gaps, and actionable insights to grow your presence."
            />
          </div>
        </div>
      </section>

      {/* Bento Features */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Built for the AI-first era
            </h2>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Large card */}
            <div className="row-span-2 rounded-3xl border bg-linear-to-br from-primary/5 to-transparent p-8 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Eye className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-bold">Mention Rate</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  See what percentage of AI responses mention your brand. Tracked across all engines, updated with every scan.
                </p>
              </div>
              <div className="mt-8 flex items-end gap-1">
                {[40, 55, 45, 65, 72, 68, 85, 78, 92].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-primary/20"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>

            <BentoCard
              icon={Search}
              title="7 AI Engines"
              description="Query ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok, and Mistral simultaneously."
            />
            <BentoCard
              icon={Users}
              title="Competitor Intel"
              description="See exactly where competitors appear and you don't. Find the gaps, close them."
            />
            <BentoCard
              icon={TrendingUp}
              title="Daily Trends"
              description="Automated daily scans show how your visibility changes over time."
            />
            {/* Wide card */}
            <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border bg-card p-8 flex flex-col sm:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-2xl font-bold">Prompt-Level Analysis</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  Track custom prompts across all engines. See which queries mention you, which don&apos;t, and at what position — broken down by engine, language, and category.
                </p>
              </div>
              <div className="grid shrink-0 grid-cols-3 gap-2">
                {["ChatGPT", "Gemini", "Claude", "Perplexity", "DeepSeek", "Grok"].map(
                  (name) => (
                    <div
                      key={name}
                      className="flex items-center justify-center gap-2 rounded-xl border bg-muted/50 px-3 py-2 text-xs font-medium"
                    >
                      <EngineIcon engine={name.toLowerCase()} size={16} />
                      {name}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            <StatBlock value="7" label="AI Engines Tracked" />
            <StatBlock value="24h" label="Scan Frequency" />
            <StatBlock value="100%" label="Automated" />
            <StatBlock value="∞" label="Custom Prompts" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to know about AI search visibility and how Citeplex works.
            </p>
          </div>

          <div className="mt-14 space-y-4">
            <FaqItem
              question="What is AI search visibility?"
              answer="AI search visibility measures how often and how prominently your brand appears in AI-generated responses. When users ask ChatGPT, Gemini, Claude, or other AI engines about topics related to your business, AI search visibility tracks whether your brand is mentioned, at what position, and how frequently compared to competitors."
            />
            <FaqItem
              question="What is AEO (Answer Engine Optimization)?"
              answer="AEO stands for Answer Engine Optimization — the practice of optimizing your brand's presence in AI-powered answer engines like ChatGPT, Perplexity, and Google Gemini. Unlike traditional SEO which focuses on search engine rankings, AEO focuses on getting your brand mentioned and recommended in AI-generated answers. Citeplex helps you track and improve your AEO performance."
            />
            <FaqItem
              question="What is GEO (Generative Engine Optimization)?"
              answer="GEO (Generative Engine Optimization) is the process of optimizing your online presence so that generative AI models reference and recommend your brand. As AI search engines like ChatGPT, Claude, and Gemini become primary information sources, GEO ensures your brand is part of the conversation. Citeplex monitors your GEO performance across 7 major AI engines."
            />
            <FaqItem
              question="How does Citeplex track AI mentions?"
              answer="Citeplex sends your custom prompts to 7 AI engines (ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok, and Mistral) daily. We analyze each response to detect if your brand is mentioned, at what position, and in what context. Results are tracked over time so you can see trends and measure the impact of your optimization efforts."
            />
            <FaqItem
              question="Which AI engines does Citeplex support?"
              answer="Citeplex tracks your visibility across 7 major AI engines: OpenAI ChatGPT, Google Gemini, Anthropic Claude, Perplexity AI, DeepSeek, xAI Grok, and Mistral AI. These engines cover the vast majority of the AI search market, giving you comprehensive visibility data."
            />
            <FaqItem
              question="How is Citeplex different from traditional SEO tools?"
              answer="Traditional SEO tools track Google search rankings. Citeplex tracks something entirely different — how AI engines talk about your brand. AI engines don't show ranked links; they generate conversational answers. Citeplex monitors whether your brand is mentioned in those answers, your position among competitors, and your mention rate across all major AI platforms."
            />
            <FaqItem
              question="What is a prompt in Citeplex?"
              answer="A prompt is a search query that Citeplex sends to AI engines on your behalf. For example, 'What is the best resume builder?' is one prompt. Each prompt is sent to all 7 AI engines daily, and the responses are analyzed for brand mentions and positioning. You can customize prompts to match the queries your potential customers might ask."
            />
            <FaqItem
              question="How often are scans performed?"
              answer="All plans include daily automated scans. Every day, Citeplex sends your prompts to all 7 AI engines, collects responses, and updates your dashboard with fresh data. This daily frequency lets you spot trends, measure changes, and react quickly to shifts in AI search visibility."
            />
            <FaqItem
              question="Can I track my competitors?"
              answer="Yes. Citeplex automatically discovers and tracks your competitors across AI engines. You can see which competitors are mentioned more frequently, compare mention rates and positions side by side, and identify opportunities where competitors appear but you don't."
            />
            <FaqItem
              question="Why is AI search visibility important for my brand?"
              answer="AI engines are rapidly becoming the primary way people search for information, products, and services. Studies show that AI-generated recommendations significantly influence purchasing decisions. If your brand isn't appearing in AI responses, you're missing a growing source of traffic, credibility, and revenue. Citeplex helps you monitor and improve this critical new channel."
            />
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is AI search visibility?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "AI search visibility measures how often and how prominently your brand appears in AI-generated responses. When users ask ChatGPT, Gemini, Claude, or other AI engines about topics related to your business, AI search visibility tracks whether your brand is mentioned, at what position, and how frequently compared to competitors.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is AEO (Answer Engine Optimization)?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "AEO stands for Answer Engine Optimization — the practice of optimizing your brand's presence in AI-powered answer engines like ChatGPT, Perplexity, and Google Gemini. Unlike traditional SEO which focuses on search engine rankings, AEO focuses on getting your brand mentioned and recommended in AI-generated answers.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is GEO (Generative Engine Optimization)?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "GEO (Generative Engine Optimization) is the process of optimizing your online presence so that generative AI models reference and recommend your brand. As AI search engines like ChatGPT, Claude, and Gemini become primary information sources, GEO ensures your brand is part of the conversation.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How does Citeplex track AI mentions?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Citeplex sends your custom prompts to 7 AI engines (ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok, and Mistral) daily. We analyze each response to detect if your brand is mentioned, at what position, and in what context.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Which AI engines does Citeplex support?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Citeplex tracks your visibility across 7 major AI engines: OpenAI ChatGPT, Google Gemini, Anthropic Claude, Perplexity AI, DeepSeek, xAI Grok, and Mistral AI.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How is Citeplex different from traditional SEO tools?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Traditional SEO tools track Google search rankings. Citeplex tracks how AI engines talk about your brand. AI engines generate conversational answers, and Citeplex monitors whether your brand is mentioned in those answers.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is a prompt in Citeplex?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "A prompt is a search query that Citeplex sends to AI engines on your behalf. Each prompt is sent to all 7 AI engines daily, and the responses are analyzed for brand mentions and positioning.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How often are scans performed?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "All plans include daily automated scans. Every day, Citeplex sends your prompts to all 7 AI engines, collects responses, and updates your dashboard with fresh data.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can I track my competitors?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Citeplex automatically discovers and tracks your competitors across AI engines. You can compare mention rates and positions side by side, and identify opportunities where competitors appear but you don't.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Why is AI search visibility important for my brand?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "AI engines are rapidly becoming the primary way people search for information, products, and services. If your brand isn't appearing in AI responses, you're missing a growing source of traffic, credibility, and revenue.",
                  },
                },
              ],
            }),
          }}
        />
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border bg-card p-10 text-center shadow-xl sm:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
            <div className="relative">
              <BarChart3 className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to own your AI narrative?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Join brands that actively track and improve their visibility
                across AI search engines. Start free, upgrade when you&apos;re ready.
              </p>
              <Button
                size="lg"
                className="mt-8 h-13 rounded-xl px-10 text-base font-semibold shadow-lg shadow-primary/25"
                asChild
              >
                <Link href="/login">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Citeplex" width={24} height={24} />
              <span className="text-sm font-bold">
                <span className="text-primary">Cite</span>plex
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link
                href="mailto:hello@citeplex.io"
                className="hover:text-foreground transition-colors"
              >
                Contact
              </Link>
              <CookieSettingsButton />
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2026 Citeplex
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BentoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-3xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function TimelineStep({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex flex-col items-center px-6 py-8 text-center">
      <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary bg-background text-3xl font-extrabold text-primary shadow-lg shadow-primary/10">
        {step}
      </div>
      <h3 className="mt-6 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>
      <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
        {answer}
      </div>
    </details>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-4xl font-extrabold tracking-tight bg-linear-to-r from-primary to-indigo-500 bg-clip-text text-transparent sm:text-5xl">
        {value}
      </p>
      <p className="mt-2 text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
