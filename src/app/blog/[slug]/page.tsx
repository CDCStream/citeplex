import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { getAuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { getPublishedPostBySlug } from "@/lib/blog-data";
import { parseBlogPost } from "@/lib/blog-parser";
import { BLOG_BRAND_NAME } from "@/lib/blog-brand";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const row = await getPublishedPostBySlug(slug).catch(() => null);
  if (!row) {
    return { title: `Not found — ${BLOG_BRAND_NAME}` };
  }
  const p = parseBlogPost(row);
  const canonical = `${getSiteUrl()}/blog/${p.slug}`;
  const ogImage =
    p.image &&
    (p.image.startsWith("http://") || p.image.startsWith("https://")
      ? p.image
      : `${getSiteUrl()}${p.image.startsWith("/") ? "" : "/"}${p.image}`);
  return {
    title: `${p.title} — ${BLOG_BRAND_NAME}`,
    description: p.description ?? undefined,
    alternates: { canonical },
    openGraph: {
      title: p.title,
      description: p.description ?? undefined,
      url: canonical,
      type: "article",
      publishedTime: p.published_at ?? undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

export default async function BlogPostPage(props: Props) {
  const { slug } = await props.params;
  const user = await getAuthUser();
  const row = await getPublishedPostBySlug(slug).catch(() => null);
  if (!row) notFound();

  const p = parseBlogPost(row);
  const safeHtml = DOMPurify.sanitize(p.content, {
    USE_PROFILES: { html: true },
  });

  const date = p.published_at
    ? new Date(p.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Citeplex" width={32} height={32} />
            <span className="text-xl font-bold">
              <span className="text-primary">Cite</span>plex
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/blog" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Blog</span>
              </Link>
            </Button>
            {user ? (
              <Button size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login">
                  Sign In
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <article className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="pointer-events-none absolute top-20 right-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:pb-28">
          {p.image ? (
            <div className="relative mb-10 aspect-2/1 w-full overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-lg shadow-primary/5">
              {/* eslint-disable-next-line @next/next/no-img-element -- remote Outrank/CDN URLs */}
              <img
                src={p.image}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          <header>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              {p.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/60 pb-8 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{p.author}</span>
              {date ? (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary/80" />
                  {date}
                </span>
              ) : null}
            </div>

            {p.tags.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <li
                    key={t}
                    className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}
          </header>

          <div
            className="prose prose-neutral dark:prose-invert mt-12 max-w-none text-[15px] leading-relaxed prose-headings:scroll-mt-24 prose-headings:font-bold prose-h2:text-2xl prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:border prose-img:border-border/60 prose-img:shadow-sm"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          <div className="mt-16 rounded-2xl border border-border/80 bg-muted/30 p-6 sm:p-8">
            <p className="text-center text-sm text-muted-foreground">
              Track how AI engines mention your brand —{" "}
              <Link href="/" className="font-semibold text-primary hover:underline">
                try Citeplex
              </Link>
              .
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
