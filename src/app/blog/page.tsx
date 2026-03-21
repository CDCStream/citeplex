import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import type { Metadata } from "next";
import { getPublishedBlogPosts } from "@/lib/blog-data";
import { parseBlogPost } from "@/lib/blog-parser";
import { BLOG_BRAND_NAME } from "@/lib/blog-brand";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: `Blog — ${BLOG_BRAND_NAME}`,
  description: `Insights and updates from ${BLOG_BRAND_NAME} on AI search visibility and AEO.`,
  alternates: { canonical: `${getSiteUrl()}/blog` },
};

export default async function BlogIndexPage() {
  let posts: Awaited<ReturnType<typeof getPublishedBlogPosts>> = [];
  try {
    posts = await getPublishedBlogPosts();
  } catch {
    posts = [];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        {BLOG_BRAND_NAME} Blog
      </h1>
      <p className="mt-2 text-muted-foreground">
        AI search visibility, AEO, and product updates.
      </p>

      <ul className="mt-10 space-y-10">
        {posts.map((row) => {
          const p = parseBlogPost(row);
          const date = p.published_at
            ? new Date(p.published_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : null;
          return (
            <li key={row.id}>
              <article className="border-b border-border pb-10 last:border-0">
                <Link href={`/blog/${p.slug}`} className="group block">
                  {p.image ? (
                    <div className="relative mb-4 aspect-2/1 w-full overflow-hidden rounded-xl border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote Outrank/CDN URLs */}
                      <img
                        src={p.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : null}
                  <h2 className="text-xl font-bold tracking-tight transition-colors group-hover:text-primary sm:text-2xl">
                    {p.title}
                  </h2>
                  {p.description ? (
                    <p className="mt-2 text-muted-foreground line-clamp-3">
                      {p.description}
                    </p>
                  ) : null}
                  {date ? (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {date}
                    </p>
                  ) : null}
                </Link>
              </article>
            </li>
          );
        })}
      </ul>

      {posts.length === 0 ? (
        <p className="mt-10 text-muted-foreground">
          No posts yet. Connect the Outrank webhook to publish articles.
        </p>
      ) : null}
    </div>
  );
}
