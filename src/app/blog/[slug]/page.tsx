import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
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
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      <article>
        {p.image ? (
          <div className="relative mb-8 aspect-2/1 w-full overflow-hidden rounded-xl border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote Outrank/CDN URLs */}
            <img
              src={p.image}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {p.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{p.author}</span>
          {date ? (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {date}
            </span>
          ) : null}
        </div>

        {p.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {p.tags.map((t) => (
              <li
                key={t}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {t}
              </li>
            ))}
          </ul>
        ) : null}

        <div
          className="prose prose-neutral dark:prose-invert mt-10 max-w-none text-[15px] leading-relaxed prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </article>
    </div>
  );
}
