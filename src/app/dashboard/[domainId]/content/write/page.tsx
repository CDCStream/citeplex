"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface SeoCheck {
  score: number;
  checks: {
    name: string;
    passed: boolean;
    message: string;
    impact: "high" | "medium" | "low";
  }[];
}

export default function WriteArticlePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const domainId = params.domainId as string;

  const [title, setTitle] = useState(searchParams.get("title") || "");
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [wordCount, setWordCount] = useState(1500);
  const planId = searchParams.get("planId") || undefined;

  const [phase, setPhase] = useState<
    "config" | "generating" | "done"
  >("config");
  const [progress, setProgress] = useState("");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [seoCheck, setSeoCheck] = useState<SeoCheck | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!title.trim()) return;
    setPhase("generating");
    setError(null);
    setProgress("Researching topic...");

    try {
      const res = await fetch(`/api/content/${domainId}/articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          keyword: keyword.trim() || undefined,
          wordCount,
          planId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      setProgress("Finalizing...");
      const data = await res.json();
      setArticleId(data.article.id);
      setSeoCheck(data.seoCheck);
      setPhase("done");
    } catch (err) {
      setError((err as Error).message);
      setPhase("config");
    }
  }

  function getSeoScoreColor(score: number) {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/${domainId}/content`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              AI Article Writer
            </h1>
            <p className="text-sm text-muted-foreground">
              Generate an SEO-optimized article with AI
            </p>
          </div>
        </div>
      </div>

      {phase === "config" && (
        <Card>
          <CardHeader>
            <CardTitle>Article Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Article Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How to Improve Your SEO in 2026"
              />
            </div>

            <div className="space-y-2">
              <Label>Target Keyword</Label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. SEO tips 2026"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the title as the target keyword.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Target Word Count: {wordCount}</Label>
              <Slider
                value={[wordCount]}
                onValueChange={([v]) => setWordCount(v)}
                min={500}
                max={5000}
                step={100}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>500</span>
                <span>2500</span>
                <span>5000</span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5 p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={!title.trim()}
              size="lg"
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Article
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              This will research the topic, create an outline, write the
              article, and check SEO — all in one step.
            </p>
          </CardContent>
        </Card>
      )}

      {phase === "generating" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold">Generating Article</h3>
            <p className="mt-2 text-sm text-muted-foreground">{progress}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              This may take 30-60 seconds...
            </p>
          </CardContent>
        </Card>
      )}

      {phase === "done" && seoCheck && (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-10 w-10 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold">Article Generated!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your article has been created and saved as a draft.
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${getSeoScoreColor(seoCheck.score)}`}
                  >
                    {seoCheck.score}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    SEO Score
                  </div>
                </div>
              </div>
              <Button className="mt-6" asChild>
                <Link
                  href={`/dashboard/${domainId}/content/article/${articleId}`}
                >
                  View & Edit Article
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {seoCheck.checks.map((check, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2 border-b last:border-0"
                >
                  {check.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{check.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          check.impact === "high"
                            ? "border-red-300 text-red-600"
                            : check.impact === "medium"
                              ? "border-yellow-300 text-yellow-600"
                              : "border-gray-300 text-gray-600"
                        }`}
                      >
                        {check.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {check.message}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
