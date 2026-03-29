"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Quote,
  Image as ImageIcon,
  Link2,
  Globe,
  Megaphone,
  ListChecks,
  HelpCircle,
  Youtube,
  Settings2,
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

interface EnhancementOptions {
  expertQuotes: boolean;
  includeImages: boolean;
  internalLinking: boolean;
  externalLinks: boolean;
  callToAction: string;
  keyTakeaways: boolean;
  keyTakeawaysPlacement: "beginning" | "end";
  generateFaqs: boolean;
  youtubeVideos: boolean;
  webImages: boolean;
}

interface SeoCheck {
  score: number;
  checks: { name: string; passed: boolean; message: string; impact: "high" | "medium" | "low" }[];
}

type Phase = "analyzing" | "config" | "outline" | "enhance" | "generating" | "done";

const PHASE_LABELS: Record<string, string> = {
  analyzing: "Analysis",
  config: "Configure",
  outline: "Outline",
  enhance: "Enhance",
  generating: "Generate",
};

const GAP_PHASES: Phase[] = ["analyzing", "config", "outline", "enhance", "generating"];
const NORMAL_PHASES: Phase[] = ["config", "enhance", "generating"];

export default function WriteArticlePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const domainId = params.domainId as string;

  const isGap = searchParams.get("gap") === "1";
  const gapPrompt = searchParams.get("keyword") || "";

  const [title, setTitle] = useState(searchParams.get("title") || "");
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [wordCount, setWordCount] = useState(1500);
  const planId = searchParams.get("planId") || undefined;

  const [phase, setPhase] = useState<Phase>(isGap ? "analyzing" : "config");
  const [progress, setProgress] = useState("");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [seoCheck, setSeoCheck] = useState<SeoCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);

  const [selectedStructure, setSelectedStructure] = useState<ArticleStructure | null>(null);
  const [customOutline, setCustomOutline] = useState("");
  const [outlineMode, setOutlineMode] = useState<"1" | "2" | "custom">("1");

  const [enhancements, setEnhancements] = useState<EnhancementOptions>({
    expertQuotes: true,
    includeImages: true,
    internalLinking: true,
    externalLinks: true,
    callToAction: "",
    keyTakeaways: true,
    keyTakeawaysPlacement: "beginning",
    generateFaqs: true,
    youtubeVideos: true,
    webImages: true,
  });

  function toggleEnhancement(key: keyof EnhancementOptions) {
    setEnhancements(prev => ({ ...prev, [key]: !prev[key] }));
  }

  useEffect(() => {
    if (!isGap || !gapPrompt) return;
    let cancelled = false;

    async function runGapAnalysis() {
      try {
        const res = await fetch(`/api/content/${domainId}/gap-analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: gapPrompt }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Gap analysis failed");
        }

        const analysis: GapAnalysis = await res.json();
        if (cancelled) return;

        setGapAnalysis(analysis);
        setTitle(analysis.title);
        setKeyword(analysis.targetKeyword);
        setSelectedStructure(analysis.recommendedStructure);
        setWordCount(analysis.recommendedStructure.wordCount);
        setPhase("config");
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message);
        setTitle(gapPrompt);
        setKeyword(gapPrompt);
        setPhase("config");
      }
    }

    runGapAnalysis();
    return () => { cancelled = true; };
  }, [isGap, gapPrompt, domainId]);

  function getActiveOutline(): OutlineSection[] | null {
    if (!gapAnalysis) return null;
    if (outlineMode === "1") return gapAnalysis.outlines[0] || null;
    if (outlineMode === "2") return gapAnalysis.outlines[1] || null;
    return null;
  }

  async function handleGenerate() {
    if (!title.trim()) return;
    setPhase("generating");
    setError(null);
    setProgress("Researching topic...");

    try {
      const articleBody: Record<string, unknown> = {
        title: title.trim(),
        keyword: keyword.trim() || undefined,
        wordCount: selectedStructure?.wordCount || wordCount,
        planId,
        enhancements,
      };

      if (gapAnalysis?.topArticles?.length) {
        articleBody.topArticles = gapAnalysis.topArticles;
      }
      if (gapAnalysis?.secondaryKeywords?.length) {
        articleBody.secondaryKeywords = gapAnalysis.secondaryKeywords.map(k => k.keyword);
      }

      const activeOutline = getActiveOutline();
      if (activeOutline && activeOutline.length > 0) {
        articleBody.outline = activeOutline;
      } else if (outlineMode === "custom" && customOutline.trim()) {
        articleBody.customOutline = customOutline.trim();
      }

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
      setPhase("enhance");
    }
  }

  function getSeoScoreColor(score: number) {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }

  const phases = isGap ? GAP_PHASES : NORMAL_PHASES;
  const currentIdx = phases.indexOf(phase);

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
          <div className={`rounded-xl p-2.5 ${isGap ? "bg-orange-500/10" : "bg-primary/10"}`}>
            {isGap ? <Target className="h-5 w-5 text-orange-600" /> : <FileText className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isGap ? "Gap Article Writer" : "AI Article Writer"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isGap ? "Write an article to close your AI visibility gap" : "Generate an SEO-optimized article with AI"}
            </p>
          </div>
        </div>
      </div>

      {/* Step indicators */}
      {phase !== "done" && (
        <div className="flex gap-2">
          {phases.map((step, i) => (
            <div key={step} className="flex-1 space-y-1">
              <div className={`h-1.5 rounded-full transition-colors ${i <= currentIdx ? "bg-primary" : "bg-muted"}`} />
              <p className={`text-[10px] text-center font-medium ${i <= currentIdx ? "text-primary" : "text-muted-foreground"}`}>
                {PHASE_LABELS[step]}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Phase: Analyzing */}
      {phase === "analyzing" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-4" />
            <h3 className="text-lg font-semibold">Analyzing Gap</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
              Finding the best keyword, analyzing top articles, extracting secondary keywords, generating outlines...
            </p>
            <p className="mt-2 text-sm font-medium text-center max-w-md">&ldquo;{gapPrompt}&rdquo;</p>
            <p className="mt-4 text-xs text-muted-foreground">This may take 1-2 minutes...</p>
          </CardContent>
        </Card>
      )}

      {/* Phase: Config */}
      {phase === "config" && (
        <>
          {/* Gap Analysis Result */}
          {gapAnalysis && (
            <Card className="border-orange-200 dark:border-orange-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-4 w-4 text-orange-600" />
                  Gap Analysis Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-orange-50 dark:bg-orange-500/5 p-3 text-sm">
                  <p className="font-medium text-orange-900 dark:text-orange-300 mb-1">Original prompt:</p>
                  <p className="text-orange-700 dark:text-orange-400">&ldquo;{gapPrompt}&rdquo;</p>
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
              </CardContent>
            </Card>
          )}

          {/* Secondary Keywords */}
          {gapAnalysis && gapAnalysis.secondaryKeywords.length > 0 && (
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
          {gapAnalysis && gapAnalysis.topArticles.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-600" />
                    Top Ranking Articles
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">{gapAnalysis.topArticles.length} found</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {gapAnalysis.topArticles.map((article, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/10 text-xs font-bold text-amber-700 shrink-0">{i + 1}</div>
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

          {/* Article Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Article Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Article Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. How to Improve Your SEO in 2026" />
              </div>
              <div className="space-y-2">
                <Label>Target Keyword</Label>
                <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. SEO tips 2026" />
              </div>

              {/* Article Structure Selection */}
              {gapAnalysis && gapAnalysis.structures.length > 0 && (
                <div className="space-y-3">
                  <Label>Article Structure</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {gapAnalysis.structures.map((s) => {
                      const isSelected = selectedStructure?.label === s.label;
                      const isRecommended = gapAnalysis.recommendedStructure.label === s.label;
                      return (
                        <button
                          key={s.label}
                          onClick={() => { setSelectedStructure(s); setWordCount(s.wordCount); }}
                          className={`rounded-lg border p-3 text-left text-sm transition-all ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/30"}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full border-2 ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"}`} />
                            <span>{s.label}</span>
                            {isRecommended && (
                              <Badge variant="secondary" className="text-[9px] ml-auto text-green-700 bg-green-100 dark:bg-green-500/10 dark:text-green-400">Recommended</Badge>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!gapAnalysis && (
                <div className="space-y-2">
                  <Label>Target Word Count: {wordCount}</Label>
                  <input type="range" value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} min={500} max={5000} step={100} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>500</span><span>2500</span><span>5000</span></div>
                </div>
              )}

              {error && <ErrorBanner message={error} />}

              <Button
                onClick={() => isGap && gapAnalysis?.outlines?.length ? setPhase("outline") : setPhase("enhance")}
                disabled={!title.trim()}
                size="lg"
                className="w-full"
              >
                {isGap && gapAnalysis?.outlines?.length ? (
                  <><LayoutList className="mr-2 h-4 w-4" />Choose Outline</>
                ) : (
                  <><Settings2 className="mr-2 h-4 w-4" />Enhancement Options</>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Phase: Outline Selection */}
      {phase === "outline" && gapAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutList className="h-5 w-5" />
              Select an Outline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-1 border-b">
              {(["1", "2", "custom"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setOutlineMode(mode)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    outlineMode === mode ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "custom" ? <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Write your own</span> : `Outline ${mode}`}
                </button>
              ))}
            </div>

            {outlineMode !== "custom" ? (
              <div className="space-y-1.5">
                {(gapAnalysis.outlines[outlineMode === "1" ? 0 : 1] || []).map((section, i) => (
                  <div key={i} className={`rounded-lg border p-3 ${section.level === 3 ? "ml-6" : ""}`}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] shrink-0 font-mono">H{section.level}</Badge>
                      <span className="text-sm font-medium">{section.heading}</span>
                    </div>
                    {section.points.length > 0 && (
                      <ul className="mt-2 ml-8 space-y-0.5">
                        {section.points.map((point, j) => (
                          <li key={j} className="text-xs text-muted-foreground list-disc">{point}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Write your outline</Label>
                <Textarea
                  value={customOutline}
                  onChange={(e) => setCustomOutline(e.target.value)}
                  placeholder={"H2: Introduction\n- Key point 1\n\nH2: Main Topic\nH3: Subtopic\n- Detail\n\nH2: Conclusion"}
                  className="min-h-[250px] font-mono text-sm"
                />
              </div>
            )}

            {error && <ErrorBanner message={error} />}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPhase("config")} className="flex-1">Back</Button>
              <Button
                onClick={() => setPhase("enhance")}
                disabled={outlineMode === "custom" && !customOutline.trim()}
                size="lg"
                className="flex-1"
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Enhancement Options
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase: Enhance */}
      {phase === "enhance" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Enhance Your Article</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Customize content features to boost engagement and SEO.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <EnhancementToggle
              icon={<Quote className="h-4 w-4" />}
              title="Include Expert Quotes"
              description="Incorporate quotes by industry experts to add credibility and depth."
              checked={enhancements.expertQuotes}
              onChange={() => toggleEnhancement("expertQuotes")}
            />

            <EnhancementToggle
              icon={<ImageIcon className="h-4 w-4" />}
              title="AI-Generated Images"
              description="Generate cover image and inline visuals with DALL-E 3."
              checked={enhancements.includeImages}
              onChange={() => toggleEnhancement("includeImages")}
            />

            <EnhancementToggle
              icon={<Globe className="h-4 w-4" />}
              title="Web Images & Infographics"
              description="Find relevant images and diagrams from the web."
              checked={enhancements.webImages}
              onChange={() => toggleEnhancement("webImages")}
            />

            <EnhancementToggle
              icon={<Youtube className="h-4 w-4" />}
              title="YouTube Videos"
              description="Embed related YouTube videos for richer content."
              checked={enhancements.youtubeVideos}
              onChange={() => toggleEnhancement("youtubeVideos")}
            />

            <EnhancementToggle
              icon={<Link2 className="h-4 w-4" />}
              title="Internal Linking"
              description="Boost SEO with automatic relevant internal links."
              checked={enhancements.internalLinking}
              onChange={() => toggleEnhancement("internalLinking")}
            />

            <EnhancementToggle
              icon={<ExternalLink className="h-4 w-4" />}
              title="External Links"
              description="Link to authoritative sources for credibility."
              checked={enhancements.externalLinks}
              onChange={() => toggleEnhancement("externalLinks")}
            />

            <EnhancementToggle
              icon={<ListChecks className="h-4 w-4" />}
              title="Key Takeaways"
              description="Highlight the most important conclusions and insights."
              checked={enhancements.keyTakeaways}
              onChange={() => toggleEnhancement("keyTakeaways")}
            >
              {enhancements.keyTakeaways && (
                <div className="mt-2 flex gap-2">
                  {(["beginning", "end"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setEnhancements(prev => ({ ...prev, keyTakeawaysPlacement: p }))}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        enhancements.keyTakeawaysPlacement === p ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary/30"
                      }`}
                    >
                      {p === "beginning" ? "Beginning of article" : "End of article"}
                    </button>
                  ))}
                </div>
              )}
            </EnhancementToggle>

            <EnhancementToggle
              icon={<Megaphone className="h-4 w-4" />}
              title="Call-to-Action"
              description="Encourage your readers to take an action."
              checked={!!enhancements.callToAction}
              onChange={() => setEnhancements(prev => ({ ...prev, callToAction: prev.callToAction ? "" : "Sign up for a free trial" }))}
            >
              {enhancements.callToAction !== "" && (
                <div className="mt-2">
                  <Input
                    value={enhancements.callToAction}
                    onChange={(e) => setEnhancements(prev => ({ ...prev, callToAction: e.target.value }))}
                    placeholder="e.g. Ask users to upgrade to read more articles"
                    className="text-sm"
                  />
                </div>
              )}
            </EnhancementToggle>

            <EnhancementToggle
              icon={<HelpCircle className="h-4 w-4" />}
              title="Generate FAQs"
              description="Address common queries at the end of the article."
              checked={enhancements.generateFaqs}
              onChange={() => toggleEnhancement("generateFaqs")}
            />

            {error && <ErrorBanner message={error} />}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setPhase(isGap && gapAnalysis?.outlines?.length ? "outline" : "config")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleGenerate} disabled={!title.trim()} size="lg" className="flex-1">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Article
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase: Generating */}
      {phase === "generating" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold">Generating Article</h3>
            <p className="mt-2 text-sm text-muted-foreground">{progress}</p>
            <div className="mt-6 w-full max-w-sm space-y-2">
              {["Research & Analysis", "Writing Content", "Adding Media", "SEO Check"].map((step, i) => (
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
              <p className="mt-2 text-sm text-muted-foreground">Your article has been created and saved as a draft.</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getSeoScoreColor(seoCheck.score)}`}>{seoCheck.score}</div>
                  <div className="text-xs text-muted-foreground">SEO Score</div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button asChild>
                  <Link href={`/dashboard/${domainId}/content/article/${articleId}`}>View & Edit Article</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/${domainId}/content/article/${articleId}?tab=preview`}>
                    <FileText className="mr-2 h-4 w-4" />Preview
                  </Link>
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

function EnhancementToggle({ icon, title, description, checked, onChange, children }: {
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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5 p-3 flex items-center gap-2">
      <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
      <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
    </div>
  );
}
