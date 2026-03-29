"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Target,
  TrendingUp,
  Search,
  ExternalLink,
  Trophy,
  Key,
  LayoutList,
  Megaphone,
  HelpCircle,
  BookOpen,
  PenTool,
  ImageIcon,
  ShieldCheck,
  BarChart3,
  Save,
} from "lucide-react";
import Link from "next/link";

interface TopArticle {
  title: string;
  url: string;
  domain: string;
  headings: string[];
  wordCount: number;
  content: string;
}

interface SecondaryKeyword {
  keyword: string;
  volume: number | null;
  difficulty: number | null;
}

interface ArticleStructure {
  headings: number;
  wordCount: number;
  label: string;
}

interface OutlineSection {
  heading: string;
  level: number;
  points: string[];
}

interface GapAnalysis {
  targetKeyword: string;
  topic: string;
  title: string;
  keywordMetrics: { volume: number | null; difficulty: number | null; cpc: number | null; traffic_potential: number | null } | null;
  reasoning: string;
  topArticles: TopArticle[];
  secondaryKeywords: SecondaryKeyword[];
  recommendedStructure: ArticleStructure;
  structures: ArticleStructure[];
  outlines: OutlineSection[][];
}

type Phase = "analyzing" | "review" | "generating" | "done";

interface StepState {
  status: "pending" | "active" | "done";
  message?: string;
  extra?: string;
}

const STEP_CONFIG = [
  { key: "research", label: "Research & Analysis", icon: Search },
  { key: "outline", label: "Building Outline", icon: BookOpen },
  { key: "writing", label: "Writing Content", icon: PenTool },
  { key: "media", label: "Media & Images", icon: ImageIcon },
  { key: "quality", label: "Quality Check", icon: ShieldCheck },
  { key: "seo", label: "SEO Optimization", icon: BarChart3 },
  { key: "saving", label: "Saving Article", icon: Save },
] as const;

type StepKey = typeof STEP_CONFIG[number]["key"];

export default function WriteArticlePage() {
  const { domainId } = useParams<{ domainId: string }>();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || searchParams.get("title") || "";
  const planId = searchParams.get("planId") || undefined;
  const isGap = searchParams.get("type") === "gap" || searchParams.get("gap") === "1";

  const [phase, setPhase] = useState<Phase>("analyzing");
  const [error, setError] = useState<string | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);

  const [includeCta, setIncludeCta] = useState(true);
  const [ctaText, setCtaText] = useState("");
  const [includeFaq, setIncludeFaq] = useState(true);

  // SSE streaming state
  const [steps, setSteps] = useState<Record<StepKey, StepState>>(() => {
    const init: Record<string, StepState> = {};
    STEP_CONFIG.forEach(s => { init[s.key] = { status: "pending" }; });
    return init as Record<StepKey, StepState>;
  });
  const [previewHtml, setPreviewHtml] = useState("");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [seoCheck, setSeoCheck] = useState<{ score: number; checks: { name: string; passed: boolean; message: string; impact: string }[] } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialPrompt || !domainId) return;
    let cancelled = false;

    async function runAnalysis() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

        const res = await fetch(`/api/content/${domainId}/gap-analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: initialPrompt }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Analysis failed");
        }

        const analysis: GapAnalysis = await res.json();
        if (cancelled) return;

        setGapAnalysis(analysis);
        setPhase("review");
      } catch (err) {
        if (cancelled) return;
        const msg = (err as Error).name === "AbortError"
          ? "Analysis timed out. Please try again."
          : (err as Error).message;
        setError(msg);
        setPhase("review");
      }
    }

    runAnalysis();
    return () => { cancelled = true; };
  }, [initialPrompt, domainId]);

  async function handleGenerate() {
    if (!gapAnalysis) return;
    setPhase("generating");
    setError(null);

    // Reset step states
    const init: Record<string, StepState> = {};
    STEP_CONFIG.forEach(s => { init[s.key] = { status: "pending" }; });
    setSteps(init as Record<StepKey, StepState>);

    try {
      const enhancements = {
        expertQuotes: true,
        includeImages: true,
        internalLinking: true,
        externalLinks: true,
        callToAction: includeCta ? (ctaText.trim() || "Sign up for a free trial") : "",
        keyTakeaways: true,
        keyTakeawaysPlacement: "beginning" as const,
        generateFaqs: includeFaq,
        youtubeVideos: true,
        webImages: true,
      };

      const articleBody: Record<string, unknown> = {
        title: gapAnalysis.title,
        keyword: gapAnalysis.targetKeyword,
        wordCount: gapAnalysis.recommendedStructure.wordCount,
        planId,
        enhancements,
        topArticles: gapAnalysis.topArticles,
        secondaryKeywords: gapAnalysis.secondaryKeywords.map(k => k.keyword),
        outline: gapAnalysis.outlines[0] || undefined,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const res = await fetch(`/api/content/${domainId}/articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        let errorMsg = "Generation failed";
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          const text = await res.text();
          errorMsg = text.slice(0, 200) || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));
            handleSSEEvent(data);
          } catch { /* skip unparseable chunks */ }
        }
      }

      // Process remaining buffer
      if (buffer.trim().startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.trim().slice(6));
          handleSSEEvent(data);
        } catch { /* skip */ }
      }
    } catch (err) {
      const msg = (err as Error).name === "AbortError"
        ? "Article generation timed out. Please try again."
        : (err as Error).message;
      setError(msg);
      setPhase("review");
    }
  }

  function handleSSEEvent(data: Record<string, unknown>) {
    switch (data.type) {
      case "step": {
        const stepKey = data.step as StepKey;
        const status = data.status as "active" | "done";
        setSteps(prev => ({
          ...prev,
          [stepKey]: {
            status,
            message: (data.message as string) || prev[stepKey]?.message,
            extra: prev[stepKey]?.extra,
          },
        }));
        break;
      }
      case "preview":
        setPreviewHtml(data.html as string);
        break;
      case "done":
        setArticleId((data.article as { id: string }).id);
        setSeoCheck(data.seoCheck as typeof seoCheck);
        setPhase("done");
        break;
      case "error":
        setError(data.message as string);
        setPhase("review");
        break;
    }
  }

  function getSeoScoreColor(score: number) {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }

  const completedSteps = Object.values(steps).filter(s => s.status === "done").length;
  const totalSteps = STEP_CONFIG.length;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/${domainId}/${isGap ? "ai-visibility" : "content"}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2.5 bg-orange-500/10">
            <Target className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gap Article Writer</h1>
            <p className="text-sm text-muted-foreground">AI will find the best keyword, structure, and write a competitive article</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {phase !== "done" && (
        <div className="flex gap-2">
          {(["analyzing", "review", "generating"] as const).map((step, i) => {
            const labels = { analyzing: "Analysis", review: "Review & Generate", generating: "Writing" };
            const stepIdx = (["analyzing", "review", "generating"] as const).indexOf(phase);
            return (
              <div key={step} className="flex-1 space-y-1">
                <div className={`h-1.5 rounded-full transition-colors ${i <= stepIdx ? "bg-primary" : "bg-muted"}`} />
                <p className={`text-[10px] text-center font-medium ${i <= stepIdx ? "text-primary" : "text-muted-foreground"}`}>
                  {labels[step]}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Phase: Analyzing */}
      {phase === "analyzing" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold">Analyzing Topic</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
              Finding the best keyword, analyzing top articles, building outline...
            </p>
            <p className="mt-2 text-sm font-medium text-center max-w-md">&ldquo;{initialPrompt}&rdquo;</p>
            <p className="mt-4 text-xs text-muted-foreground">This may take 4-5 minutes...</p>
          </CardContent>
        </Card>
      )}

      {/* Phase: Review */}
      {phase === "review" && gapAnalysis && (
        <>
          {/* AI Analysis Result */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                AI Analysis Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium mb-1">Original prompt:</p>
                <p className="text-muted-foreground">&ldquo;{initialPrompt}&rdquo;</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Target Keyword</p>
                  <p className="font-semibold text-sm">{gapAnalysis.targetKeyword}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Article Title</p>
                  <p className="font-semibold text-sm">{gapAnalysis.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { val: gapAnalysis.keywordMetrics?.volume, label: "Volume", color: "text-primary" },
                  { val: gapAnalysis.keywordMetrics?.difficulty, label: "KD", color: (gapAnalysis.keywordMetrics?.difficulty ?? 100) <= 30 ? "text-green-600" : (gapAnalysis.keywordMetrics?.difficulty ?? 100) <= 60 ? "text-yellow-600" : "text-red-600" },
                  { val: gapAnalysis.keywordMetrics?.cpc != null ? `$${gapAnalysis.keywordMetrics.cpc}` : "N/A", label: "CPC", color: "" },
                  { val: gapAnalysis.keywordMetrics?.traffic_potential, label: "Traffic Pot.", color: "text-blue-600" },
                ].map((m, i) => (
                  <div key={i} className="rounded-lg border p-3 text-center">
                    <p className={`text-lg font-bold ${m.color}`}>{m.val ?? "N/A"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Ranking Articles */}
          {gapAnalysis.topArticles.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  Top Ranking Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gapAnalysis.topArticles.map((article, i) => (
                    <a key={i} href={article.url} target="_blank" rel="noopener" className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${article.domain}&sz=32`}
                        alt={article.domain}
                        width={20}
                        height={20}
                        className="rounded mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{article.title}</p>
                        <p className="text-xs text-muted-foreground">{article.domain} &middot; {article.wordCount.toLocaleString()} words &middot; {article.headings.length} headings</p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Secondary Keywords */}
          {gapAnalysis.secondaryKeywords.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4 text-purple-600" />
                  Secondary Keywords
                  <Badge variant="secondary" className="text-[10px]">{gapAnalysis.secondaryKeywords.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {gapAnalysis.secondaryKeywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs py-1">
                      {kw.keyword}
                      {kw.volume != null && <span className="ml-1 text-muted-foreground">({kw.volume})</span>}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Structure & Outline */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{gapAnalysis.recommendedStructure.label}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <LayoutList className="h-4 w-4 text-blue-600" />
                  Article Outline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 py-1.5 mb-1">
                    <Badge className="text-[10px] shrink-0 font-mono bg-primary text-primary-foreground">H1</Badge>
                    <span className="text-sm font-semibold">{gapAnalysis.title}</span>
                  </div>
                  <div className="border-l-2 border-muted ml-3 pl-3 space-y-1">
                    {gapAnalysis.outlines[0].map((section, i) => (
                      <div key={i} className={`flex items-center gap-2 py-1.5 ${section.level === 3 ? "ml-6" : ""}`}>
                        <Badge variant="outline" className="text-[10px] shrink-0 font-mono">H{section.level}</Badge>
                        <span className="text-sm">{section.heading}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Options: CTA & FAQ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ToggleOption
                icon={<HelpCircle className="h-4 w-4" />}
                title="Include FAQ Section"
                description="Auto-generate frequently asked questions."
                checked={includeFaq}
                onChange={() => setIncludeFaq(prev => !prev)}
              />

              <ToggleOption
                icon={<Megaphone className="h-4 w-4" />}
                title="Include Call-to-Action"
                description="Add a CTA section to encourage reader action."
                checked={includeCta}
                onChange={() => setIncludeCta(prev => !prev)}
              >
                {includeCta && (
                  <div className="mt-2">
                    <Input
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="e.g. Try our platform for free"
                      className="text-sm"
                    />
                  </div>
                )}
              </ToggleOption>
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5 p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <Button onClick={handleGenerate} size="lg" className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Article
          </Button>
        </>
      )}

      {/* Phase: Review with no analysis (error fallback) */}
      {phase === "review" && !gapAnalysis && error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold">Analysis Failed</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">{error}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/dashboard/${domainId}/ai-visibility`}>Go Back</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Phase: Generating (SSE streaming) */}
      {phase === "generating" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Writing Article</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{gapAnalysis?.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{progressPct}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Progress</p>
                </div>
              </div>

              {/* Animated progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-8">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Steps */}
              <div className="space-y-1">
                {STEP_CONFIG.map(({ key, label, icon: Icon }) => {
                  const step = steps[key];
                  const isDone = step.status === "done";
                  const isActive = step.status === "active";
                  const isPending = step.status === "pending";

                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-4 rounded-lg px-4 py-3 transition-all duration-500 ${
                        isActive ? "bg-primary/5 border border-primary/20" :
                        isDone ? "bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20" :
                        "border border-transparent"
                      }`}
                    >
                      <div className={`shrink-0 rounded-full p-2 transition-all duration-500 ${
                        isDone ? "bg-green-100 dark:bg-green-500/20" :
                        isActive ? "bg-primary/10" :
                        "bg-muted"
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 animate-in zoom-in-50 duration-300" />
                        ) : isActive ? (
                          <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium transition-colors duration-300 ${
                          isDone ? "text-green-700 dark:text-green-400" :
                          isActive ? "text-foreground" :
                          "text-muted-foreground"
                        }`}>
                          {label}
                        </p>
                        {isActive && step.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 animate-in fade-in slide-in-from-left-2 duration-300">
                            {step.message}
                          </p>
                        )}
                        {isDone && step.extra && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">{step.extra}</p>
                        )}
                      </div>
                      {isDone && (
                        <Badge variant="outline" className="text-[10px] border-green-300 text-green-600 shrink-0 animate-in fade-in zoom-in-75 duration-300">
                          Done
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          {previewHtml && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={previewRef}
                  className="prose prose-sm dark:prose-invert max-w-none max-h-[300px] overflow-y-auto rounded-lg bg-muted/30 p-4 animate-in fade-in duration-700"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">Content preview — full article will be available when complete</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Phase: Done */}
      {phase === "done" && seoCheck && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-green-100 dark:bg-green-500/20 p-4 mb-4 animate-in zoom-in-50 duration-500">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Article Generated!</h3>
              <p className="mt-2 text-sm text-muted-foreground">Your article has been saved as a draft.</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getSeoScoreColor(seoCheck.score)}`}>{seoCheck.score}</div>
                  <div className="text-xs text-muted-foreground">SEO Score</div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button asChild>
                  <Link href={`/dashboard/${domainId}/content/article/${articleId}?tab=preview`}>
                    <FileText className="mr-2 h-4 w-4" />Preview Article
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/${domainId}/content/history`}>Content History</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">SEO Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {seoCheck.checks.map((check, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0">
                  {check.passed ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{check.name}</span>
                      <Badge variant="outline" className={`text-[10px] ${check.impact === "high" ? "border-red-300 text-red-600" : check.impact === "medium" ? "border-yellow-300 text-yellow-600" : "border-gray-300 text-gray-600"}`}>
                        {check.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{check.message}</p>
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

function ToggleOption({ icon, title, description, checked, onChange, children }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border p-4 transition-colors ${checked ? "border-primary/30 bg-primary/5" : ""}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onChange}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
            checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
          }`}
        >
          {checked && <CheckCircle2 className="h-3.5 w-3.5" />}
        </button>
        <div className="flex items-start gap-2 flex-1">
          <span className="text-primary mt-0.5 shrink-0">{icon}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
