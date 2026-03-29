"use client";

import { useState, useEffect } from "react";
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

interface SeoCheck {
  score: number;
  checks: { name: string; passed: boolean; message: string; impact: "high" | "medium" | "low" }[];
}

type Phase = "analyzing" | "review" | "generating" | "done";

export default function WriteArticlePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const domainId = params.domainId as string;

  const isGap = searchParams.get("gap") === "1";
  const initialPrompt = searchParams.get("keyword") || searchParams.get("title") || "";
  const planId = searchParams.get("planId") || undefined;

  const [phase, setPhase] = useState<Phase>("analyzing");
  const [progress, setProgress] = useState("");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [seoCheck, setSeoCheck] = useState<SeoCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);

  const [includeCta, setIncludeCta] = useState(true);
  const [ctaText, setCtaText] = useState("");
  const [includeFaq, setIncludeFaq] = useState(true);

  useEffect(() => {
    if (!initialPrompt) return;
    let cancelled = false;

    async function runAnalysis() {
      try {
        const res = await fetch(`/api/content/${domainId}/gap-analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: initialPrompt }),
        });

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
        setError((err as Error).message);
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
    setProgress("Researching topic...");

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

      const res = await fetch(`/api/content/${domainId}/articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleBody),
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
      setPhase("review");
    }
  }

  function getSeoScoreColor(score: number) {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }

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

              <div className="flex items-start gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-muted-foreground">{gapAnalysis.reasoning}</p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Structure</p>
                <p className="text-sm font-medium">{gapAnalysis.recommendedStructure.label}</p>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Keywords */}
          {gapAnalysis.secondaryKeywords.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4 text-violet-600" />
                  Secondary Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {gapAnalysis.secondaryKeywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs py-1 px-2.5 gap-1.5">
                      {kw.keyword}
                      {kw.volume !== null && <span className="text-muted-foreground">vol:{kw.volume}</span>}
                      {kw.difficulty !== null && (
                        <span className={kw.difficulty <= 30 ? "text-green-600" : kw.difficulty <= 60 ? "text-yellow-600" : "text-red-500"}>
                          KD:{kw.difficulty}
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Ranking Articles */}
          {gapAnalysis.topArticles.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-600" />
                    Top Ranking Articles
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">{gapAnalysis.topArticles.length} found</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Your article will outperform these.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {gapAnalysis.topArticles.map((article, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/10 text-xs font-bold text-amber-700 shrink-0">{i + 1}</div>
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${article.domain}&sz=32`}
                      alt={article.domain}
                      width={20}
                      height={20}
                      className="rounded mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{article.title}</p>
                      <p className="text-xs text-muted-foreground">{article.domain} · {article.wordCount.toLocaleString()} words · {article.headings.length} headings</p>
                    </div>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-muted transition-colors shrink-0">
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Outline Preview */}
          {gapAnalysis.outlines[0]?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <LayoutList className="h-4 w-4" />
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
          )}

          {/* User Options: CTA & FAQ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Options</CardTitle>
              <p className="text-xs text-muted-foreground">Everything else is included automatically (expert quotes, images, videos, links, key takeaways).</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ToggleOption
                icon={<HelpCircle className="h-4 w-4" />}
                title="Generate FAQs"
                description="Add a FAQ section at the end of the article."
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

      {/* Phase: Generating */}
      {phase === "generating" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold">Writing Article</h3>
            <p className="mt-2 text-sm text-muted-foreground">{progress}</p>
            <div className="mt-6 w-full max-w-sm space-y-2">
              {["Research & Analysis", "Writing Content", "Adding Media & Images", "Coherence Check", "SEO Optimization"].map((step) => (
                <div key={step} className="flex items-center gap-3 text-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">This may take 2-3 minutes...</p>
          </CardContent>
        </Card>
      )}

      {/* Phase: Done */}
      {phase === "done" && seoCheck && (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-10 w-10 text-green-600 mb-4" />
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
