"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Eye,
  ArrowLeft,
  HelpCircle,
  Download,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

const ARTICLE_STYLES = `
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.8; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 24px; background: #fff; }
    h1 { font-family: system-ui, -apple-system, sans-serif; font-size: 2.5em; line-height: 1.2; margin-bottom: 0.5em; color: #111; }
    h2 { font-family: system-ui, -apple-system, sans-serif; font-size: 1.6em; margin: 2em 0 0.8em; color: #222; border-bottom: 2px solid #f0f0f0; padding-bottom: 0.3em; }
    h3 { font-family: system-ui, -apple-system, sans-serif; font-size: 1.25em; margin: 1.5em 0 0.6em; color: #333; }
    p { margin: 0.8em 0; }
    ul, ol { margin: 1em 0; padding-left: 1.5em; }
    li { margin: 0.4em 0; }
    a { color: #2563eb; text-decoration: underline; text-decoration-color: #93c5fd; text-underline-offset: 2px; }
    a:hover { color: #1d4ed8; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    blockquote { border-left: 4px solid #3b82f6; margin: 1.5em 0; padding: 1em 1.5em; background: #f8fafc; border-radius: 0 8px 8px 0; font-style: italic; }
    blockquote cite { display: block; margin-top: 0.5em; font-style: normal; font-size: 0.9em; color: #64748b; }
    blockquote.expert-quote { border-left-color: #8b5cf6; background: #faf5ff; }
    figure { margin: 2em 0; }
    figure img { max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    figcaption { text-align: center; font-size: 0.85em; color: #64748b; margin-top: 0.5em; }
    table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-family: system-ui, sans-serif; font-size: 0.95em; }
    thead { background: #f1f5f9; }
    th { padding: 12px 16px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
    td { padding: 10px 16px; border-bottom: 1px solid #f1f5f9; }
    tr:hover td { background: #f8fafc; }
    .key-takeaways { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 1.5em; margin: 2em 0; }
    .key-takeaways h3 { color: #166534; margin: 0 0 0.8em; font-size: 1.1em; }
    .key-takeaways ul { margin: 0; }
    .key-takeaways li { color: #15803d; }
    .cta-box { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #93c5fd; border-radius: 12px; padding: 2em; margin: 2em 0; text-align: center; }
    .cta-box h3 { color: #1e40af; margin-bottom: 0.5em; }
    .cta-box p { color: #1e3a5f; margin-bottom: 1em; }
    .cta-button { display: inline-block; background: #2563eb; color: #fff !important; text-decoration: none !important; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-family: system-ui, sans-serif; transition: background 0.2s; }
    .cta-button:hover { background: #1d4ed8; }
    .faq-section { margin: 2em 0; }
    .faq-item { border: 1px solid #e2e8f0; border-radius: 8px; margin: 0.5em 0; padding: 1em 1.5em; }
    .faq-item h3 { font-size: 1em; color: #1e293b; margin-bottom: 0.5em; }
    .faq-item p { font-size: 0.95em; color: #475569; margin: 0; }
    .cover-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 2em; }
    .cover-meta .tag { display: inline-block; background: #f1f5f9; color: #475569; font-size: 0.75em; padding: 4px 12px; border-radius: 99px; font-family: system-ui, sans-serif; }
    .cover-img { width: 100%; border-radius: 16px; margin-bottom: 1.5em; box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
    iframe { border: 0; border-radius: 12px; }
    @media print { body { padding: 0; } .cta-box, .cta-button { display: none; } }
  </style>
`;

function buildFullHtml(article: ArticleData): string {
  const coverHtml = article.coverImage
    ? `<img src="${article.coverImage}" alt="${article.title}" class="cover-img" />`
    : "";
  const tagsHtml = article.tags.length > 0
    ? `<div class="cover-meta">${article.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>`
    : "";
  const faqHtml = article.faq.length > 0
    ? `<div class="faq-section"><h2>Frequently Asked Questions</h2>${article.faq.map(f => `<div class="faq-item"><h3>${f.question}</h3><p>${f.answer}</p></div>`).join("")}</div>`
    : "";
  const schemaHtml = article.faq.length > 0
    ? `<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.faq.map(f => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      })}</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${(article.metaDescription || "").replace(/"/g, "&quot;")}">
  <title>${article.title}</title>
  ${ARTICLE_STYLES}
  ${schemaHtml}
</head>
<body>
  ${coverHtml}
  <h1>${article.title}</h1>
  ${tagsHtml}
  ${article.content || ""}
  ${faqHtml}
</body>
</html>`;
}

export function ArticleEditor({
  domainId,
  article,
}: {
  domainId: string;
  article: ArticleData;
  integrations: Integration[];
}) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "preview";
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  function handleDownloadHtml() {
    const html = buildFullHtml(article);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${article.slug || "article"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopyHtml() {
    const html = buildFullHtml(article);
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const previewHtml = buildFullHtml(article);

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
              <span className="text-xs text-muted-foreground">{article.wordCount} words</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyHtml}>
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy HTML"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadHtml}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download HTML
          </Button>
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="preview">
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
            FAQ
          </TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <iframe
                ref={previewRef}
                srcDoc={previewHtml}
                className="w-full rounded-lg border-0"
                style={{ minHeight: "800px" }}
                title="Article Preview"
                sandbox="allow-same-origin"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="mt-4">
          <Card>
            <CardHeader><CardTitle>FAQ Section</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {article.faq.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No FAQ items generated for this article.</p>
              ) : (
                article.faq.map((item, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm font-medium">{item.question}</p>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{item.answer}</p>
                  </div>
                ))
              )}
              {article.faq.length > 0 && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-xs font-medium mb-2">FAQ JSON-LD Schema (copy to your page):</p>
                  <pre className="text-[10px] bg-background p-3 rounded overflow-x-auto">
                    {JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "FAQPage",
                      mainEntity: article.faq.map(item => ({
                        "@type": "Question",
                        name: item.question,
                        acceptedAnswer: { "@type": "Answer", text: item.answer },
                      })),
                    }, null, 2)}
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
