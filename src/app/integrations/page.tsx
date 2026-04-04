import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ChevronRight,
  Plug,
  Sparkles,
  Zap,
  PenLine,
  Send,
  Check,
} from "lucide-react";
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/site";

const PAGE_TITLE = "Integrations — Publish Everywhere | Citeplex";
const PAGE_DESCRIPTION =
  "Write once with Citeplex, publish automatically to WordPress, Webflow, Shopify, Ghost, Notion, Wix, Framer, Feather, and more. 10+ publishing integrations included.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "wordpress integration",
    "webflow cms",
    "shopify blog",
    "ghost cms",
    "notion integration",
    "auto publish articles",
    "content publishing automation",
    "ai content publishing",
    "headless cms integration",
  ],
  alternates: { canonical: `${getSiteUrl()}/integrations` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${getSiteUrl()}/integrations`,
    type: "website",
  },
};

type Platform = {
  id: string;
  name: string;
  category: string;
  logo: string;
  description: string;
  adapterType: "native" | "api";
  features: string[];
  featured?: boolean;
};

const PLATFORMS: Platform[] = [
  {
    id: "wordpress",
    name: "WordPress",
    category: "CMS",
    logo: "/logos/wordpress.svg",
    description:
      "Publish directly to your WordPress site via REST API with Application Passwords. Full support for drafts, tags, excerpts, and featured images.",
    adapterType: "native",
    features: ["Auto-publish drafts", "Tag & category sync", "Featured image upload"],
    featured: true,
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "E-commerce",
    logo: "/logos/shopify.svg",
    description:
      "Publish blog posts to your Shopify store. Drive organic traffic to your products with SEO-optimized articles written by AI.",
    adapterType: "api",
    features: ["Blog article sync", "SEO meta fields", "Product-aware content"],
    featured: true,
  },
  {
    id: "ghost",
    name: "Ghost",
    category: "Headless CMS",
    logo: "/logos/ghost.svg",
    description:
      "JWT-authenticated Admin API publishing. Push articles with tags, cover images, and meta descriptions to your Ghost publication.",
    adapterType: "native",
    features: ["Admin API (JWT)", "Cover image sync", "Tag mapping"],
  },
  {
    id: "webflow",
    name: "Webflow",
    category: "Website Builder",
    logo: "/logos/webflow.svg",
    description:
      "Push articles directly to Webflow CMS collections. Keep your design-first website fed with fresh, SEO-optimized content.",
    adapterType: "api",
    features: ["CMS collection sync", "Rich text support", "Custom fields"],
  },
  {
    id: "notion",
    name: "Notion",
    category: "Workspace",
    logo: "/logos/notion.svg",
    description:
      "Create pages in your Notion workspace automatically. Use Notion as a content hub for review, collaboration, and distribution.",
    adapterType: "api",
    features: ["Page creation", "Database properties", "Team collaboration"],
  },
  {
    id: "wix",
    name: "Wix",
    category: "Website Builder",
    logo: "/logos/wix.svg",
    description:
      "Post articles to your Wix blog. Seamlessly integrate AI-written content into your Wix website.",
    adapterType: "api",
    features: ["Blog post sync", "SEO settings", "Draft support"],
  },
  {
    id: "framer",
    name: "Framer",
    category: "Design Tool",
    logo: "/logos/framer.svg",
    description:
      "Publish content to Framer CMS. Combine Framer's design capabilities with Citeplex's AI content engine.",
    adapterType: "api",
    features: ["CMS integration", "Design-first workflow", "Auto-publish"],
  },
  {
    id: "feather",
    name: "Feather",
    category: "Blog Platform",
    logo: "/logos/feather.svg",
    description:
      "Push posts to your Feather blog. A lightweight, fast blogging platform powered by AI-generated content.",
    adapterType: "api",
    features: ["Post sync", "Markdown support", "Lightweight publishing"],
  },
  {
    id: "webhook",
    name: "API Webhook",
    category: "Custom",
    logo: "/logos/webhook.svg",
    description:
      "Send article data to any endpoint via HTTP POST. Build custom integrations with your own backend, CMS, or automation pipeline.",
    adapterType: "native",
    features: ["Custom endpoints", "Secret headers", "Full payload control"],
  },
];

const FAQ_ITEMS = [
  {
    question: "How do I connect WordPress to Citeplex?",
    answer:
      "Go to your domain's Content dashboard, click Integrations, and select WordPress. Enter your site URL, username, and an Application Password (generated in WordPress under Users → Profile → Application Passwords). Citeplex will test the connection and start publishing articles directly to your WordPress site.",
  },
  {
    question: "Can I publish to multiple platforms at once?",
    answer:
      "Yes. You can connect multiple integrations per domain. When you publish an article, you choose which platform(s) to send it to. Each article tracks where it has been published, so you never accidentally duplicate content.",
  },
  {
    question: "Does Citeplex support custom CMS platforms?",
    answer:
      "Yes. The API Webhook integration lets you send article data (title, content, slug, meta description, cover image, tags, FAQ) as a JSON payload to any HTTP endpoint. You can use this to integrate with any CMS, headless CMS, or custom backend that accepts POST requests.",
  },
  {
    question: "Are my API credentials secure?",
    answer:
      "All API credentials are stored encrypted in our database and are never exposed to the frontend. Credentials are only used server-side when publishing articles. We recommend using application-specific passwords or scoped API tokens rather than admin credentials.",
  },
  {
    question: "Does auto-publish work with daily article generation?",
    answer:
      "Currently, daily article generation creates articles in 'draft' status. You can review them in your Content dashboard and publish to any connected integration with one click. Full auto-publish support (write → publish automatically) is on our roadmap.",
  },
  {
    question: "What data is sent when publishing an article?",
    answer:
      "Each publish payload includes: title, slug, HTML content, meta description, cover image URL, tags array, FAQ array (with JSON-LD), and publish status (draft or published). The exact fields mapped depend on the platform's API.",
  },
];

const STEPS = [
  {
    step: 1,
    title: "Connect your platform",
    description: "Add your API credentials or webhook URL in the Integrations tab. Citeplex tests the connection automatically.",
    icon: Plug,
  },
  {
    step: 2,
    title: "Write with AI",
    description: "Generate SEO-optimized articles with Ahrefs keyword data, brand voice matching, AI images, and citations.",
    icon: PenLine,
  },
  {
    step: 3,
    title: "Publish everywhere",
    description: "One click to publish to any connected platform. Your article goes live with all metadata, images, and tags intact.",
    icon: Send,
  },
];

export default async function IntegrationsPage() {
  let user = null;
  try {
    user = await getAuthUser();
  } catch {
    user = null;
  }

  const featured = PLATFORMS.filter((p) => p.featured);
  const standard = PLATFORMS.filter((p) => !p.featured && p.id !== "webhook");
  const utility = PLATFORMS.filter((p) => p.id === "webhook");

  return (
    <div className="min-h-screen bg-background overflow-hidden pt-16">
      <SiteHeader authenticated={!!user} />

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/12 via-transparent to-transparent" />
        <div className="pointer-events-none absolute top-24 left-1/4 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute top-40 right-1/4 h-64 w-64 rounded-full bg-indigo-500/8 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-6 pt-10 sm:px-6 sm:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Plug className="h-4 w-4" />
              10+ Integrations
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Publish{" "}
              <span className="bg-linear-to-r from-primary via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Everywhere
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground sm:text-xl">
              Write once with Citeplex, publish automatically to WordPress,
              Webflow, Shopify, and 7+ more platforms.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Platforms */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {featured.map((p) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-card via-card to-primary/3 p-8 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="absolute right-4 top-4 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {p.adapterType === "native" ? "Native" : "API"}
                </div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Image src={p.logo} alt={p.name} width={28} height={28} className="h-7 w-7 object-contain" />
                </div>
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {p.category}
                </div>
                <h3 className="text-2xl font-bold tracking-tight">{p.name}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                <ul className="mt-5 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Standard Platforms */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {standard.map((p) => (
              <div
                key={p.id}
                className="group overflow-hidden rounded-xl border border-border/80 bg-card p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Image src={p.logo} alt={p.name} width={24} height={24} className="h-6 w-6 object-contain" />
                  </div>
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {p.adapterType === "native" ? "Native" : "API"}
                  </span>
                </div>
                <div className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {p.category}
                </div>
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 shrink-0 text-primary/70" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Utility Platforms */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {utility.map((p) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 p-6 transition-all duration-300 hover:border-primary/20"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-sm">
                    <Image src={p.logo} alt={p.name} width={20} height={20} className="h-5 w-5 object-contain" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{p.name}</h3>
                    <span className="text-[11px] font-medium text-muted-foreground">{p.category}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
              <Zap className="h-3.5 w-3.5" />
              How It Works
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Three steps to automated publishing
            </h2>
            <p className="mt-4 text-muted-foreground">
              Connect your platform, generate content, and publish — all from one dashboard.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <s.icon className="h-7 w-7" />
                </div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                  Step {s.step}
                </div>
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Publishing integrations FAQ
            </h2>
            <p className="mt-4 text-muted-foreground">
              Common questions about connecting and publishing to external platforms.
            </p>
          </div>

          <div className="mt-14 space-y-4">
            {FAQ_ITEMS.map((faq) => (
              <details key={faq.question} className="group rounded-xl border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ_ITEMS.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border bg-card p-10 text-center shadow-xl sm:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
            <div className="relative">
              <Sparkles className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to automate your publishing?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Write SEO-optimized articles with AI and publish to any platform — WordPress,
                Shopify, Webflow, and more — with one click.
              </p>
              <Button
                size="lg"
                className="mt-8 h-13 rounded-xl px-10 text-base font-semibold shadow-lg shadow-primary/25"
                asChild
              >
                <Link href="/login">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SoftwareApplication JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Citeplex",
            applicationCategory: "BusinessApplication",
            description: PAGE_DESCRIPTION,
            url: getSiteUrl(),
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              description: "Free trial available",
            },
            featureList: PLATFORMS.map((p) => `${p.name} integration`),
          }),
        }}
      />
    </div>
  );
}
