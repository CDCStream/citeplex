import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
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
  const user = await getAuthUser();

  let posts: Awaited<ReturnType<typeof getPublishedBlogPosts>> = [];
  try {
    posts = await getPublishedBlogPosts();
  } catch {
    posts = [];
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav — matches landing */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Citeplex" width={32} height={32} />
            <span className="text-xl font-bold">
              <span className="text-primary">Cite</span>plex
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            {user ? (
              <Button size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
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

      {/* Hero + content */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/12 via-transparent to-transparent" />
        <div className="pointer-events-none absolute top-24 left-1/4 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute top-40 right-1/4 h-64 w-64 rounded-full bg-indigo-500/8 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pb-28 sm:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Insights &amp; updates
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {BLOG_BRAND_NAME}{" "}
              <span className="bg-linear-to-r from-primary via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Blog
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground sm:text-xl">
              AI search visibility, AEO, GEO, and product updates — written for
              teams who care how models talk about their brand.
            </p>
          </div>

          {posts.length > 0 ? (
            <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:gap-8">
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
                    <article className="group h-full">
                      <Link
                        href={`/blog/${p.slug}`}
                        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5"
                      >
                        <div className="relative aspect-2/1 w-full overflow-hidden bg-muted">
                          {p.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element -- remote URLs */
                            <img
                              src={p.image}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 via-muted to-indigo-500/10">
                              <span className="text-4xl font-black text-primary/20">
                                {p.title.slice(0, 1).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </div>
                        <div className="flex flex-1 flex-col p-6 sm:p-7">
                          {date ? (
                            <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {date}
                            </p>
                          ) : null}
                          <h2 className="text-xl font-bold leading-snug tracking-tight transition-colors group-hover:text-primary sm:text-2xl">
                            {p.title}
                          </h2>
                          {p.description ? (
                            <p className="mt-3 line-clamp-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                              {p.description}
                            </p>
                          ) : null}
                          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                            Read article
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </Link>
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mx-auto mt-16 max-w-lg">
              <div className="relative overflow-hidden rounded-2xl border border-dashed border-primary/25 bg-linear-to-br from-card via-card to-primary/4 p-10 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">
                  Fresh articles coming soon
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  Connect the Outrank webhook to publish posts to this blog, or
                  use the admin API — they&apos;ll show up here automatically.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild>
                    <Link href="/">
                      Back to Home
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/pricing">View pricing</Link>
                  </Button>
                </div>
                <p className="mt-6 text-xs text-muted-foreground">
                  Docs:{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                    /api/outrank/webhook
                  </code>
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
