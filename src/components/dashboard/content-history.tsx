"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Eye,
  Download,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  metaDescription: string | null;
  coverImage: string | null;
  wordCount: number;
  targetKeyword: string | null;
  tags: string[];
  seoScore: number | null;
  status: string;
  publishedTo: { platform: string; url?: string; id?: string }[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Integration {
  id: string;
  platform: string;
  isActive: boolean;
}

const PLATFORM_LABELS: Record<string, string> = {
  wordpress: "WordPress",
  notion: "Notion",
  webflow: "Webflow",
  shopify: "Shopify",
  wix: "Wix",
  ghost: "Ghost",
  framer: "Framer",
  feather: "Feather",
  webhook: "API Webhook",
  citeplex: "Citeplex Blog",
};

export function ContentHistoryClient({
  domainId,
  brandName,
  articles,
  integrations,
}: {
  domainId: string;
  brandName: string;
  articles: ArticleItem[];
  integrations: Integration[];
}) {
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<{ articleId: string; success: boolean; message: string } | null>(null);

  const filtered = articles.filter((a) => {
    if (filter === "draft" && a.status !== "draft") return false;
    if (filter === "published" && a.status !== "published") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || (a.targetKeyword || "").toLowerCase().includes(q);
    }
    return true;
  });

  async function handlePublish(articleId: string, platform: string) {
    setPublishingId(articleId);
    setPublishResult(null);

    try {
      const res = await fetch(`/api/content/${domainId}/articles/${articleId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPublishResult({ articleId, success: false, message: data.error || "Publishing failed" });
      } else {
        setPublishResult({ articleId, success: true, message: `Published to ${PLATFORM_LABELS[platform] || platform}` });
        window.location.reload();
      }
    } catch (err) {
      setPublishResult({ articleId, success: false, message: (err as Error).message });
    } finally {
      setPublishingId(null);
    }
  }

  function getSeoColor(score: number | null) {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400">Published</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400">Scheduled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const unpublishedPlatforms = (article: ArticleItem) => {
    const publishedPlatforms = new Set(article.publishedTo.map(p => p.platform));
    return integrations.filter(i => !publishedPlatforms.has(i.platform));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/${domainId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Content History</h1>
            <p className="text-sm text-muted-foreground">{brandName} &middot; {articles.length} article{articles.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-1 border rounded-lg p-0.5">
          {(["all", "draft", "published"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f === "draft" ? "Drafts" : "Published"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{articles.length}</p>
            <p className="text-xs text-muted-foreground">Total Articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{articles.filter(a => a.status === "published").length}</p>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{articles.filter(a => a.status === "draft").length}</p>
            <p className="text-xs text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {articles.length > 0 ? Math.round(articles.reduce((s, a) => s + (a.seoScore || 0), 0) / articles.length) : 0}
            </p>
            <p className="text-xs text-muted-foreground">Avg SEO Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Article List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-10 w-10 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">No articles yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filter !== "all" ? "No articles match this filter." : "Gap articles and scheduled articles will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((article) => {
            const availablePlatforms = unpublishedPlatforms(article);
            const isPublishing = publishingId === article.id;

            return (
              <Card key={article.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Cover image */}
                    {article.coverImage && (
                      <div className="lg:w-48 h-32 lg:h-auto shrink-0 overflow-hidden">
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-4 lg:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">{article.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {getStatusBadge(article.status)}
                            {article.seoScore !== null && (
                              <span className={`text-xs font-semibold ${getSeoColor(article.seoScore)}`}>
                                SEO: {article.seoScore}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">{article.wordCount.toLocaleString()} words</span>
                            {article.targetKeyword && (
                              <Badge variant="secondary" className="text-[10px]">{article.targetKeyword}</Badge>
                            )}
                          </div>
                          {article.metaDescription && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{article.metaDescription}</p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/${domainId}/content/article/${article.id}?tab=preview`}>
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              Preview
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/${domainId}/content/article/${article.id}`}>
                              <FileText className="mr-1.5 h-3.5 w-3.5" />
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {/* Published to + Manual Publish */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          <Clock className="inline h-3 w-3 mr-0.5" />
                          {formatDate(article.createdAt)}
                        </span>

                        {article.publishedTo.length > 0 && (
                          <>
                            <span className="text-muted-foreground">·</span>
                            {article.publishedTo.map((p, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-xs">
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                {p.url ? (
                                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-green-700 dark:text-green-400 hover:underline">
                                    {PLATFORM_LABELS[p.platform] || p.platform}
                                    <ExternalLink className="inline h-2.5 w-2.5 ml-0.5" />
                                  </a>
                                ) : (
                                  <span className="text-green-700 dark:text-green-400">{PLATFORM_LABELS[p.platform] || p.platform}</span>
                                )}
                              </span>
                            ))}
                          </>
                        )}

                        {/* Manual publish buttons for unpublished integrations */}
                        {availablePlatforms.length > 0 && (
                          <>
                            <span className="text-muted-foreground">·</span>
                            {availablePlatforms.map((integration) => (
                              <Button
                                key={integration.id}
                                variant="outline"
                                size="sm"
                                className="h-6 text-[11px] px-2 gap-1"
                                disabled={isPublishing}
                                onClick={() => handlePublish(article.id, integration.platform)}
                              >
                                {isPublishing ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                                Publish to {PLATFORM_LABELS[integration.platform] || integration.platform}
                              </Button>
                            ))}
                          </>
                        )}
                      </div>

                      {/* Publish result feedback */}
                      {publishResult && publishResult.articleId === article.id && (
                        <div className={`mt-2 flex items-center gap-2 text-xs rounded-md p-2 ${
                          publishResult.success
                            ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                            : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                        }`}>
                          {publishResult.success
                            ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            : <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          }
                          {publishResult.message}
                        </div>
                      )}

                      {/* Tags */}
                      {article.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {article.tags.slice(0, 5).map((tag, i) => (
                            <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{tag}</span>
                          ))}
                          {article.tags.length > 5 && (
                            <span className="text-[10px] text-muted-foreground">+{article.tags.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
