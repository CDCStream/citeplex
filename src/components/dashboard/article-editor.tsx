"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  FileText,
  Save,
  Loader2,
  ArrowLeft,
  Eye,
  Code,
  Tag,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface FaqItem {
  question: string;
  answer: string;
}

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  metaDescription: string | null;
  coverImage: string | null;
  content: string | null;
  wordCount: number;
  targetKeyword: string | null;
  secondaryKeywords: string[];
  tags: string[];
  faq: FaqItem[];
  seoScore: number | null;
  status: string;
  publishedTo: unknown[];
  createdAt: string;
}

interface Integration {
  id: string;
  platform: string;
  isActive: boolean;
}

export function ArticleEditor({
  domainId,
  article,
  integrations,
}: {
  domainId: string;
  article: ArticleData;
  integrations: Integration[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [metaDescription, setMetaDescription] = useState(
    article.metaDescription || ""
  );
  const [coverImage, setCoverImage] = useState(article.coverImage || "");
  const [content, setContent] = useState(article.content || "");
  const [tags, setTags] = useState(article.tags.join(", "));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/content/${domainId}/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          metaDescription,
          coverImage: coverImage || null,
          content,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      router.refresh();
    } catch {
      // keep editing
    } finally {
      setSaving(false);
    }
  }

  function getSeoScoreColor(score: number | null) {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/${domainId}/content`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{article.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{article.status}</Badge>
              {article.seoScore !== null && (
                <span
                  className={`text-xs font-semibold ${getSeoScoreColor(article.seoScore)}`}
                >
                  SEO: {article.seoScore}/100
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {article.wordCount} words
              </span>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save
        </Button>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Content
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
            FAQ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cover Image URL</Label>
                  <Input
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  <Tag className="inline h-3.5 w-3.5 mr-1" />
                  Tags
                </Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="SEO, AI, Marketing"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Code className="h-4 w-4" />
                  Article HTML
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[500px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  {metaDescription.length}/160 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label>Target Keyword</Label>
                <Input
                  value={article.targetKeyword || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
            </CardContent>
          </Card>

          {article.seoScore !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  SEO Score
                  <span
                    className={`text-2xl ${getSeoScoreColor(article.seoScore)}`}
                  >
                    {article.seoScore}/100
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="faq" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>FAQ Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {article.faq.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No FAQ items generated for this article.
                </p>
              ) : (
                article.faq.map((item, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm font-medium">{item.question}</p>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {item.answer}
                    </p>
                  </div>
                ))
              )}

              {article.faq.length > 0 && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-xs font-medium mb-2">
                    FAQ JSON-LD Schema (copy to your page):
                  </p>
                  <pre className="text-[10px] bg-background p-3 rounded overflow-x-auto">
                    {JSON.stringify(
                      {
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: article.faq.map((item) => ({
                          "@type": "Question",
                          name: item.question,
                          acceptedAnswer: {
                            "@type": "Answer",
                            text: item.answer,
                          },
                        })),
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
