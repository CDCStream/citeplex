import Link from "next/link";
import { ArrowLeft, ArrowRight, Bot, PenLine, Sparkles, Target, FileText } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sanitizeBlogHtml } from "@/lib/sanitize-blog-html";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

async function getExample(slug: string) {
  const { data } = await supabaseAdmin
    .from("writing_examples")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const ex = await getExample(decodeURIComponent(slug));
  if (!ex) return { title: "Not Found — Citeplex" };

  const canonical = `${getSiteUrl()}/examples/${encodeURIComponent(ex.slug)}`;
  return {
    title: `${ex.title} — Citeplex Writing Example`,
    description: ex.meta_description ?? undefined,
    alternates: { canonical },
    openGraph: {
      title: ex.title,
      description: ex.meta_description ?? undefined,
      url: canonical,
      type: "article",
      images: ex.cover_image_url ? [{ url: ex.cover_image_url }] : undefined,
    },
  };
}

export default async function ExampleDetailPage(props: Props) {
  const { slug } = await props.params;
  const ex = await getExample(decodeURIComponent(slug));
  if (!ex) notFound();

  let user = null;
  try {
    user = await getAuthUser();
  } catch {
    user = null;
  }

  const safeHtml = await sanitizeBlogHtml(ex.content);
  const canonical = `${getSiteUrl()}/examples/${encodeURIComponent(ex.slug)}`;

  return (
    <div className="min-h-screen bg-background overflow-hidden pt-16">
      <SiteHeader authenticated={!!user} />

      <article className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="pointer-events-none absolute top-20 right-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:pb-28">
          {/* Back link */}
          <Link
            href="/examples"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            All Examples
          </Link>

          {/* Cover image */}
          {ex.cover_image_url && (
            <div className="relative mb-10 aspect-2/1 w-full overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-lg shadow-primary/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ex.cover_image_url}
                alt={ex.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <header>
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Bot className="h-3.5 w-3.5" />
              AI-Generated Writing Example
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              {ex.title}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              This article was written entirely by Citeplex&apos;s AI pipeline for <strong className="text-foreground">{ex.brand_name}</strong>&apos;s blog — zero hand-editing.
              The same engine is available to every Citeplex customer.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-b border-border/60 pb-8">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <PenLine className="h-3 w-3 text-primary" />
                {ex.brand_name}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Target className="h-3 w-3 text-primary" />
                {ex.keyword}
              </span>
              {ex.word_count > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3 w-3 text-primary" />
                  {ex.word_count.toLocaleString()} words
                </span>
              )}
            </div>
          </header>

          <div
            className="blog-post-content prose prose-neutral dark:prose-invert mt-12 max-w-none text-[15px] leading-relaxed prose-headings:scroll-mt-24 prose-headings:font-bold prose-h2:text-2xl prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:border prose-img:border-border/60 prose-img:shadow-sm prose-table:w-full"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          {/* CTA Banner */}
          <div className="mt-16 relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 via-card to-indigo-500/5 p-8 sm:p-10">
            <div className="relative text-center">
              <Sparkles className="mx-auto h-8 w-8 text-primary" />
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight">
                This article was generated by Citeplex
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Claude Opus 4.6 writing, Ahrefs keyword research, AI-generated images,
                brand voice matching, FAQ schema, and auto-publishing — all included in every plan.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" className="rounded-xl font-semibold shadow-lg shadow-primary/25" asChild>
                  <Link href="/login">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl font-semibold" asChild>
                  <Link href="/examples">View More Examples</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Article JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: ex.title,
            description: ex.meta_description,
            image: ex.cover_image_url ?? undefined,
            author: {
              "@type": "Organization",
              name: "Citeplex",
              url: getSiteUrl(),
            },
            publisher: {
              "@type": "Organization",
              name: "Citeplex",
              logo: { "@type": "ImageObject", url: `${getSiteUrl()}/logo.png` },
            },
            datePublished: ex.created_at,
            url: canonical,
            keywords: ex.keyword,
            about: {
              "@type": "Thing",
              name: ex.brand_name,
              url: ex.brand_url,
            },
          }),
        }}
      />

      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: getSiteUrl() },
              { "@type": "ListItem", position: 2, name: "Writing Examples", item: `${getSiteUrl()}/examples` },
              { "@type": "ListItem", position: 3, name: ex.title },
            ],
          }),
        }}
      />
    </div>
  );
}
