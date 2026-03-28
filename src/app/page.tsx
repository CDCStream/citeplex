import Link from "next/link";
import Image from "next/image";
import { Poppins } from "next/font/google";
import { getAuthUser } from "@/lib/auth";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { EngineIcon } from "@/components/ui/engine-icon";
import { SquishyPricing } from "@/components/ui/squishy-pricing";
import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { getSeatsRemaining } from "@/lib/customer-count";
import { PLAN_PRODUCT_IDS } from "@/lib/plans";
import { ParticleCanvas } from "@/components/ui/particle-canvas";
import { HeroCta } from "@/components/marketing/hero-cta";
import {
  Search,
  BarChart3,
  Users,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Eye,
  Target,
  PenLine,
  Globe,
  ImageIcon,
  Link2,
  MessageSquareText,
  Sparkles,
} from "lucide-react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default async function LandingPage() {
  const user = await getAuthUser();
  const { tier, seatsLeft } = await getSeatsRemaining();

  return (
    <div className="min-h-screen bg-background overflow-hidden pt-16">
      <SiteHeader authenticated={!!user} />

      {/* Hero */}
      <section className="relative">
        <ParticleCanvas />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-40 right-1/4 h-56 w-56 rounded-full bg-blue-400/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16 sm:pb-24 lg:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1
              className={`${poppins.className} text-4xl font-semibold leading-[1.15] sm:text-5xl lg:text-6xl`}
              style={{
                background: "linear-gradient(to bottom, #111111, #111111, rgba(17, 17, 17, 0.5))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.05em",
              }}
            >
              Boost your SEO, AEO & GEO —{" "}
              <br className="hidden sm:inline" />
              <span
                style={{
                  background: "linear-gradient(to bottom, #3b82f6, #2563eb, rgba(37, 99, 235, 0.6))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                all from one platform
              </span>
            </h1>

            <p className={`${poppins.className} mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl`}>
              Monitor AI engines, find where competitors outrank you,
              write targeted content and publish automatically.
            </p>

            <div className="mt-8 mx-auto w-full max-w-4xl overflow-hidden rounded-xl border shadow-2xl shadow-primary/10">
              <iframe
                src="https://app.supademo.com/embed/cmn8n50co10xkmbsix4q1as7d?embed_v=2"
                loading="lazy"
                title="Citeplex Interactive Demo"
                allow="clipboard-write"
                className="w-full"
                style={{ height: "500px", border: "none" }}
              />
            </div>

            <HeroCta />
          </div>

          {/* Engine Marquee */}
          <p className="mt-8 mb-4 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Supported 7 AI Engines
          </p>
          <div className="relative overflow-hidden">
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

        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t">
        <SquishyPricing tier={tier} seatsLeft={seatsLeft} productIds={PLAN_PRODUCT_IDS} />
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              From setup to results — in minutes
            </h2>
          </div>

          <div className="relative mt-16 grid gap-0 lg:grid-cols-4">
            <div className="absolute top-10 left-[12.5%] right-[12.5%] hidden h-0.5 bg-linear-to-r from-primary/20 via-primary to-primary/20 lg:block" />

            <TimelineStep
              step={1}
              title="Add your brand"
              description="Enter your website URL. We detect your industry, analyze your brand voice, find competitors, and suggest prompts automatically."
            />
            <TimelineStep
              step={2}
              title="We scan AI engines"
              description="Every day, we query all 7 AI engines with your prompts and analyze each response — mentions, rank, sentiment, and insights."
            />
            <TimelineStep
              step={3}
              title="We write & publish"
              description="AI-powered articles with Ahrefs keyword research, your brand voice, AI images, YouTube videos, and FAQ schema — published automatically."
            />
            <TimelineStep
              step={4}
              title="Grow & dominate"
              description="Track your visibility trends, close competitor gaps with targeted articles, build high DR backlinks, and get mentioned by AI engines."
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
              Everything you need to{" "}
              <span className="bg-linear-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                dominate AI search
              </span>{" "}
              <span className="bg-linear-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                and increase organic traffic
              </span>
            </h2>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Large card — AI Visibility */}
            <div className="row-span-2 rounded-3xl border bg-linear-to-br from-primary/5 to-transparent p-8 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Eye className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-bold">AI Visibility Tracking</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Track how often AI engines mention your brand across 7 platforms. Daily scans with sentiment analysis and AI-powered insights on why you rank — or why you don&apos;t.
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
              description="ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok, and Mistral — scanned daily, all at once."
            />
            <BentoCard
              icon={Users}
              title="Competitor Intelligence"
              description="See where competitors show up and you don't. Close the gaps with targeted articles designed to get you mentioned."
            />
            <BentoCard
              icon={PenLine}
              title="AI Article Writer"
              description="Claude Opus 4.6 writes SEO-optimized articles with your brand voice, Ahrefs keywords, AI images, and YouTube videos built in."
            />
            <BentoCard
              icon={Target}
              title="Gap Articles"
              description="We detect prompts where AI engines mention competitors but not you — then write targeted articles to close that gap and get you mentioned."
            />

            {/* Large card — Content Engine */}
            <div className="row-span-2 rounded-3xl border bg-linear-to-br from-blue-500/5 to-transparent p-8 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-bold">Brand Voice Matching</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  We analyze your existing content and learn your writing style. Every article matches your tone, vocabulary, and personality — so it sounds like you, not a robot.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-2">
                {["Tone", "Style", "Vocabulary", "Personality"].map((tag) => (
                  <div key={tag} className="rounded-lg border bg-muted/50 px-3 py-2 text-center text-xs font-medium">
                    {tag}
                  </div>
                ))}
              </div>
            </div>

            <BentoCard
              icon={TrendingUp}
              title="Daily Trends & Insights"
              description="Track visibility changes over time. AI Insight Engine explains why your rank changed and what to do next."
            />
            <BentoCard
              icon={MessageSquareText}
              title="Sentiment Analysis"
              description="Every mention is classified as positive, negative, or neutral. Know how AI engines feel about your brand."
            />

            {/* Wide card — Full Pipeline */}
            <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border bg-card p-8 flex flex-col sm:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-2xl font-bold">Full Content Pipeline</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  From keyword research to published article — fully automated. Ahrefs data drives keyword selection, Claude Opus 4.6 writes with your brand voice, and articles publish to WordPress, Webflow, Shopify and more.
                </p>
              </div>
              <div className="grid shrink-0 grid-cols-3 gap-2">
                {[
                  { icon: Search, label: "Keywords" },
                  { icon: PenLine, label: "Writing" },
                  { icon: ImageIcon, label: "AI Images" },
                  { icon: Globe, label: "110+ Langs" },
                  { icon: Link2, label: "Backlinks" },
                  { icon: Target, label: "Publishing" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-center gap-2 rounded-xl border bg-muted/50 px-3 py-2 text-xs font-medium"
                  >
                    <item.icon className="h-4 w-4 text-primary" />
                    {item.label}
                  </div>
                ))}
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
              answer="It shows how often AI engines mention your brand. When people ask ChatGPT, Gemini, or Claude about your industry, do they bring up your name? Citeplex tracks that — how often, at what rank, and compared to your competitors."
            />
            <FaqItem
              question="What is AEO (Answer Engine Optimization)?"
              answer="AEO means Answer Engine Optimization. It is like SEO, but for AI. Instead of ranking on Google, you aim to get mentioned in AI answers from ChatGPT, Perplexity, and Gemini. Citeplex helps you track and improve your AEO results."
            />
            <FaqItem
              question="What is GEO (Generative Engine Optimization)?"
              answer="GEO stands for Generative Engine Optimization. The goal is simple: make AI models mention and recommend your brand. As more people use AI to search, GEO makes sure you are part of the answer. Citeplex tracks your GEO score across 7 AI engines."
            />
            <FaqItem
              question="How does Citeplex track AI mentions?"
              answer="Every day, we send your prompts to 7 AI engines. Then we read each answer and check if your brand is there. We note the rank, the tone, and the context. You can see the results on your dashboard and track changes over time."
            />
            <FaqItem
              question="Which AI engines does Citeplex support?"
              answer="We support 7 engines: ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok, and Mistral. Together, they cover most of the AI search market."
            />
            <FaqItem
              question="How is Citeplex different from traditional SEO tools?"
              answer="SEO tools track Google rankings. Citeplex tracks AI answers. AI engines do not show a list of links — they write full responses. We check if your brand appears in those responses, where it ranks, and how often it comes up."
            />
            <FaqItem
              question="What is a prompt in Citeplex?"
              answer="A prompt is a question we ask AI engines for you. For example: 'What is the best resume builder?' We send it to all 7 engines daily and check if they mention your brand. You can add any question your customers might ask."
            />
            <FaqItem
              question="How often are scans performed?"
              answer="Every day. We send your prompts to all 7 AI engines once a day. Your dashboard updates with fresh data each morning. This helps you spot trends and act fast."
            />
            <FaqItem
              question="Can I track my competitors?"
              answer="Yes. We find your competitors and track them too. You can compare mention rates side by side. When a competitor shows up and you do not, we flag that as a gap you can close."
            />
            <FaqItem
              question="Why is AI search visibility important for my brand?"
              answer="More people now use AI to search for products and services. If AI engines do not mention your brand, you lose traffic and trust. Citeplex helps you see where you stand and what to do about it."
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
                    text: "It shows how often AI engines mention your brand. When people ask ChatGPT, Gemini, or Claude about your industry, do they bring up your name? Citeplex tracks that — how often, at what rank, and compared to your competitors.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is AEO (Answer Engine Optimization)?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "AEO means Answer Engine Optimization. It is like SEO, but for AI. Instead of ranking on Google, you aim to get mentioned in AI answers from ChatGPT, Perplexity, and Gemini. Citeplex helps you track and improve your AEO results.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is GEO (Generative Engine Optimization)?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "GEO stands for Generative Engine Optimization. The goal is simple: make AI models mention and recommend your brand. As more people use AI to search, GEO makes sure you are part of the answer. Citeplex tracks your GEO score across 7 AI engines.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How does Citeplex track AI mentions?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Every day, we send your prompts to 7 AI engines. Then we read each answer and check if your brand is there. We note the rank, the tone, and the context. You can see the results on your dashboard.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Which AI engines does Citeplex support?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "We support 7 engines: ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok, and Mistral. Together, they cover most of the AI search market.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How is Citeplex different from traditional SEO tools?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "SEO tools track Google rankings. Citeplex tracks AI answers. AI engines do not show a list of links — they write full responses. We check if your brand appears in those responses, where it ranks, and how often it comes up.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is a prompt in Citeplex?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "A prompt is a question we ask AI engines for you. For example: 'What is the best resume builder?' We send it to all 7 engines daily and check if they mention your brand.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How often are scans performed?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Every day. We send your prompts to all 7 AI engines once a day. Your dashboard updates with fresh data each morning.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can I track my competitors?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. We find your competitors and track them too. You can compare mention rates side by side. When a competitor shows up and you do not, we flag that gap.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Why is AI search visibility important for my brand?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "More people now use AI to search for products and services. If AI engines do not mention your brand, you lose traffic and trust. Citeplex helps you see where you stand and what to do about it.",
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
                Track your brand across 7 AI engines. Start free today.
                Upgrade when you need more prompts.
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
