import Link from "next/link";
import { Calendar } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { SiteHeader } from "@/components/marketing/site-header";
import { getPublishedPostBySlug } from "@/lib/blog-data";
import { parseBlogPost } from "@/lib/blog-parser";
import { sanitizeBlogHtml } from "@/lib/sanitize-blog-html";
import { safeOgDate } from "@/lib/blog-metadata";
import { BLOG_BRAND_NAME } from "@/lib/blog-brand";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  try {
    const { slug } = await props.params;
    const decodedSlug = decodeURIComponent(slug);
    const row = await getPublishedPostBySlug(decodedSlug).catch(() => null);
    if (!row) {
      return { title: `Not found — ${BLOG_BRAND_NAME}` };
    }
    let p;
    try {
      p = parseBlogPost(row);
    } catch {
      return { title: `Blog — ${BLOG_BRAND_NAME}` };
    }
    const canonical = `${getSiteUrl()}/blog/${encodeURIComponent(p.slug)}`;
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
        publishedTime: safeOgDate(p.published_at),
        images: ogImage ? [{ url: ogImage }] : undefined,
      },
    };
  } catch (e) {
    console.error("[blog generateMetadata]", e);
    return { title: `Blog — ${BLOG_BRAND_NAME}` };
  }
}

export default async function BlogPostPage(props: Props) {
  const { slug } = await props.params;
  const decodedSlug = decodeURIComponent(slug);

  let user = null;
  try {
    user = await getAuthUser();
  } catch {
    user = null;
  }

  const row = await getPublishedPostBySlug(decodedSlug).catch(() => null);
  if (!row) notFound();

  let p;
  try {
    p = parseBlogPost(row);
  } catch {
    notFound();
  }

  const safeHtml = await sanitizeBlogHtml(p.content);

  const date = p.published_at
    ? new Date(p.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-background overflow-hidden pt-16">
      <SiteHeader authenticated={!!user} />

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
            className="blog-post-content prose prose-neutral dark:prose-invert mt-12 max-w-none text-[15px] leading-relaxed prose-headings:scroll-mt-24 prose-headings:font-bold prose-h2:text-2xl prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:border prose-img:border-border/60 prose-img:shadow-sm prose-table:w-full"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          <div className="mt-16 rounded-2xl border border-border/80 bg-muted/30 p-6 sm:p-8">
            <p className="text-center text-sm text-muted-foreground">
              Track AI visibility, write SEO articles with your brand voice, and get mentioned by AI engines —{" "}
              <Link href="/" className="font-semibold text-primary hover:underline">
                try Citeplex free for 14 days
              </Link>
              .
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
