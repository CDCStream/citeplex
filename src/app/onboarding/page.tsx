"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Building2,
  MessageSquare,
  Users,
  Loader2,
  X,
  Plus,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { COUNTRIES, countryFlag } from "@/lib/constants/countries";
import { Favicon } from "@/components/ui/favicon";
import { EngineIcon } from "@/components/ui/engine-icon";
import { motion } from "framer-motion";

const STEPS = [
  { label: "Website", icon: Globe },
  { label: "Brand", icon: Building2 },
  { label: "Prompts", icon: MessageSquare },
  { label: "Competitors", icon: Users },
];

const SCAN_ENGINES = ["chatgpt", "perplexity", "gemini", "claude", "deepseek", "grok", "mistral"];

interface PromptItem {
  text: string;
  category: string;
  language?: string;
  country?: string;
}

interface CompetitorItem {
  brandName: string;
  url: string;
}

function getCountryObj(code: string) {
  return COUNTRIES.find((c) => c.code === code);
}

function flag(code: string) {
  return countryFlag(code);
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Step 1: URL
  const [url, setUrl] = useState("");

  // Step 2: Brand details + Country
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [primaryCountry, setPrimaryCountry] = useState("US");
  const [targetCountries, setTargetCountries] = useState<string[]>(["US"]);

  // Step 3: Prompts
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [promptLimit, setPromptLimit] = useState(3);
  const [promptsUsedElsewhere, setPromptsUsedElsewhere] = useState(0);

  const remainingPrompts = Math.max(0, promptLimit - promptsUsedElsewhere - prompts.length);
  const isAtLimit = remainingPrompts <= 0;

  useEffect(() => {
    fetch("/api/user/prompt-usage")
      .then((r) => r.json())
      .then((data) => {
        setPromptLimit(data.limit);
        setPromptsUsedElsewhere(data.used);
      })
      .catch(() => {});
  }, []);

  // Step 4: Competitors
  const [competitors, setCompetitors] = useState<CompetitorItem[]>([]);
  const [newCompetitorUrl, setNewCompetitorUrl] = useState("");

  const [countrySearch, setCountrySearch] = useState("");

  const availableCountries = useMemo(() => {
    const notSelected = COUNTRIES.filter((c) => !targetCountries.includes(c.code));
    if (!countrySearch.trim()) return notSelected;
    const q = countrySearch.toLowerCase();
    return notSelected.filter(
      (c) => c.name.toLowerCase().includes(q) || c.nativeName.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [targetCountries, countrySearch]);

  function toggleTargetCountry(code: string) {
    setTargetCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function handleAnalyze() {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
      setUrl(normalizedUrl);

      const res = await fetch("/api/onboarding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setBrandName(data.brandName || "");
        setDescription(data.description || "");
        setIndustry(data.industry || "");
        if (data.primaryCountry) {
          setPrimaryCountry(data.primaryCountry);
          setTargetCountries([data.primaryCountry]);
        }
      }
      setStep(1);
    } catch {
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePrompts() {
    setLoading(true);
    try {
      const countries = targetCountries
        .map((code) => getCountryObj(code))
        .filter(Boolean)
        .map((c) => ({ code: c!.code, lang: c!.lang, langName: c!.langName }));

      const res = await fetch("/api/onboarding/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, description, industry, countries }),
      });
      const data = await res.json();
      if (res.ok && data.prompts) {
        setPrompts(data.prompts);
      }
      setStep(2);
    } catch {
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function handleFindCompetitors() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, description, industry }),
      });
      const data = await res.json();
      if (res.ok && data.competitors) {
        setCompetitors(data.competitors);
      }
      setStep(3);
    } catch {
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  const [analyzingPrompt, setAnalyzingPrompt] = useState(false);

  async function addPrompt() {
    const text = newPrompt.trim();
    if (!text || isAtLimit) return;

    setAnalyzingPrompt(true);
    setNewPrompt("");
    try {
      const res = await fetch("/api/onboarding/analyze-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setPrompts((prev) => [
        ...prev,
        {
          text,
          category: data.category || "general",
          language: data.language || "en",
          country: data.country || "US",
        },
      ]);
    } catch {
      setPrompts((prev) => [...prev, { text, category: "general" }]);
    } finally {
      setAnalyzingPrompt(false);
    }
  }

  function removePrompt(index: number) {
    setPrompts(prompts.filter((_, i) => i !== index));
  }

  function extractBrandFromUrl(rawUrl: string): string {
    try {
      const hostname = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`).hostname;
      return hostname.replace(/^www\./, "").split(".")[0];
    } catch {
      return rawUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[./]/)[0];
    }
  }

  function addCompetitor() {
    const raw = newCompetitorUrl.trim();
    if (!raw) return;
    const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
    const brand = extractBrandFromUrl(normalized);
    setCompetitors([
      ...competitors,
      { brandName: brand, url: normalized },
    ]);
    setNewCompetitorUrl("");
  }

  function removeCompetitor(index: number) {
    setCompetitors(competitors.filter((_, i) => i !== index));
  }

  const [scanDomainId, setScanDomainId] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState({
    completed: 0,
    total: SCAN_ENGINES.length,
  });
  const [scanDone, setScanDone] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("citeplex_scanning");
    if (!saved) return;

    fetch(`/api/scan-status/${saved}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "scanning") {
          setScanDomainId(saved);
          setStep(4);
          if (data.progress) setScanProgress(data.progress);
        } else {
          localStorage.removeItem("citeplex_scanning");
        }
      })
      .catch(() => {
        localStorage.removeItem("citeplex_scanning");
      });
  }, []);

  async function handleFinish() {
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          brandName,
          description,
          industry,
          primaryCountry,
          targetCountries,
          prompts,
          competitors,
        }),
      });
      const data = await res.json();
      if (res.ok && data.domainId) {
        localStorage.setItem("citeplex_scanning", data.domainId);
        setScanDomainId(data.domainId);
        setStep(4);
        const promptCount = prompts.filter((p) => p.text?.trim()).length;
        setScanProgress({
          completed: 0,
          total: Math.max(1, promptCount) * SCAN_ENGINES.length,
        });
      }
    } catch {
      // stay on page
    } finally {
      setSaving(false);
    }
  }

  const pollScanStatus = useCallback(async () => {
    if (!scanDomainId) return;
    try {
      const res = await fetch(`/api/scan-status/${scanDomainId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.progress) {
        setScanProgress(data.progress);
      }
      if (data.status === "completed") {
        if (data.progress) {
          setScanProgress({ completed: data.progress.total, total: data.progress.total });
        }
        setScanDone(true);
        localStorage.removeItem("citeplex_scanning");
        setTimeout(() => {
          window.location.href = `/dashboard/${scanDomainId}`;
        }, 2500);
      }
    } catch { /* ignore */ }
  }, [scanDomainId]);

  useEffect(() => {
    if (step !== 4 || !scanDomainId || scanDone) return;
    const interval = setInterval(pollScanStatus, 2000);
    pollScanStatus();
    return () => clearInterval(interval);
  }, [step, scanDomainId, scanDone, pollScanStatus]);

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Step progress bar */}
        {step < 4 ? (
          <div className="flex gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div
                key={s.label}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 mb-8">
            {STEPS.map((s) => (
              <div
                key={s.label}
                className="h-1.5 flex-1 rounded-full bg-primary"
              />
            ))}
          </div>
        )}

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            {/* Step 0: Enter URL */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Add your website</h1>
                  <p className="text-muted-foreground mt-1">
                    We&apos;ll analyze your site to set up AI visibility tracking.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">Website URL</Label>
                  <Input
                    id="url"
                    placeholder="https://yoursite.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  />
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={!url.trim() || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze website
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step 1: Confirm brand details + Country selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  {url && <Favicon url={url} size={32} />}
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Confirm your details</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      We gathered this from your website. Edit if needed.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input
                      id="brandName"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What does your company do?"
                    />
                    <p className="text-xs text-muted-foreground">
                      Focus on what you offer. Don&apos;t include brand names.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. SaaS, E-commerce, Marketing"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryCountry">Primary Country</Label>
                    <select
                      id="primaryCountry"
                      value={primaryCountry}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPrimaryCountry(val);
                        if (!targetCountries.includes(val)) {
                          setTargetCountries([val, ...targetCountries]);
                        }
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {flag(c.code)} {c.nativeName} ({c.langName})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Your brand&apos;s main market. Detected from your website.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Countries</Label>
                    <p className="text-xs text-muted-foreground">
                      We&apos;ll generate prompts in each country&apos;s language.
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {targetCountries.map((code) => {
                        const c = getCountryObj(code);
                        if (!c) return null;
                        return (
                          <Badge
                            key={code}
                            variant="default"
                            className="cursor-pointer gap-1 pr-1.5"
                            onClick={() => {
                              if (code === primaryCountry) return;
                              toggleTargetCountry(code);
                            }}
                          >
                            {flag(code)} {c.nativeName}
                            {code !== primaryCountry && (
                              <X className="h-3 w-3 ml-0.5" />
                            )}
                          </Badge>
                        );
                      })}
                    </div>

                    <div className="relative mt-2">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search countries..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>

                    {availableCountries.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pt-1">
                        {availableCountries.map((c) => (
                          <Badge
                            key={c.code}
                            variant="outline"
                            className="cursor-pointer hover:bg-accent text-xs"
                            onClick={() => {
                              toggleTargetCountry(c.code);
                              setCountrySearch("");
                            }}
                          >
                            {flag(c.code)} {c.nativeName}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleGeneratePrompts}
                    disabled={!brandName.trim() || targetCountries.length === 0 || loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Review prompts */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  {url && <Favicon url={url} size={28} />}
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tracking prompts</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      These are queries people ask AI assistants. We&apos;ll track if your brand appears.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">
                    Prompts used: <span className="font-semibold text-foreground">{promptsUsedElsewhere + prompts.length}</span> / {promptLimit}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    remainingPrompts === 0
                      ? "bg-destructive/10 text-destructive"
                      : remainingPrompts <= 2
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-emerald-500/10 text-emerald-600"
                  }`}>
                    {remainingPrompts} remaining
                  </span>
                </div>

                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {prompts.map((prompt, i) => {
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg border p-3 text-sm"
                      >
                        {prompt.country && (
                          <span className="shrink-0 inline-flex items-center justify-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground leading-none mt-1">
                            {prompt.country}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div>{prompt.text}</div>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0 mt-0.5">
                          {prompt.category}
                        </Badge>
                        <button
                          onClick={() => removePrompt(i)}
                          className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {isAtLimit ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-4 text-center space-y-2">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                      You&apos;ve reached your prompt limit ({promptLimit} prompts)
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      Remove some prompts or{" "}
                      <a href="/pricing" className="underline font-semibold hover:text-amber-800 dark:hover:text-amber-300">
                        upgrade your plan
                      </a>{" "}
                      to add more.
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2 items-end">
                    <textarea
                      placeholder="Add a custom prompt..."
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          addPrompt();
                        }
                      }}
                      rows={2}
                      disabled={analyzingPrompt}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                    <Button variant="outline" size="icon" onClick={addPrompt} disabled={!newPrompt.trim() || analyzingPrompt} className="shrink-0 h-10 w-10">
                      {analyzingPrompt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
                {analyzingPrompt && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Detecting language and category...
                  </p>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleFindCompetitors}
                    disabled={prompts.length === 0 || loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finding Competitors...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review competitors */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  {url && <Favicon url={url} size={28} />}
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Your competitors</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      We&apos;ll track their AI visibility alongside yours.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {competitors.map((comp, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                    >
                      <Favicon url={comp.url} size={20} />
                      <div className="flex-1">
                        <div className="font-medium">{comp.brandName}</div>
                        <div className="text-xs text-muted-foreground">{comp.url}</div>
                      </div>
                      <button
                        onClick={() => removeCompetitor(i)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="https://competitor.com"
                    value={newCompetitorUrl}
                    onChange={(e) => setNewCompetitorUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={addCompetitor}
                    disabled={!newCompetitorUrl.trim()}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Finish
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            {/* Step 4: Scanning progress */}
            {step === 4 && (
              <div className="space-y-8 py-4">
                <div className="text-center space-y-2">
                  {!scanDone ? (
                    <>
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <Radio className="h-5 w-5 animate-pulse" />
                        <h1 className="text-2xl font-bold tracking-tight">Scanning AI engines...</h1>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        We&apos;re querying 7 AI engines to measure your brand visibility.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-2 text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <h1 className="text-2xl font-bold tracking-tight">Scan complete!</h1>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Redirecting to your dashboard...
                      </p>
                    </>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${scanDone ? "bg-emerald-500" : "bg-primary"}`}
                      initial={{ width: "2%" }}
                      animate={{
                        width: scanDone
                          ? "100%"
                          : scanProgress.total > 0
                            ? `${Math.max(2, (scanProgress.completed / scanProgress.total) * 100)}%`
                            : "2%",
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {scanDone
                      ? `${scanProgress.total} / ${scanProgress.total} completed`
                      : `${scanProgress.completed} / ${scanProgress.total} queries completed`
                    }
                  </p>
                </div>

                {/* Engine icons */}
                <div className="flex justify-center gap-4 flex-wrap">
                  {SCAN_ENGINES.map((engine, i) => (
                    <motion.div
                      key={engine}
                      className="flex flex-col items-center gap-1.5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className={`rounded-full p-2 ${
                        scanDone
                          ? "bg-emerald-50 ring-1 ring-emerald-200"
                          : "bg-muted/50 ring-1 ring-border animate-pulse"
                      }`}>
                        <EngineIcon engine={engine} size={24} />
                      </div>
                      <span className="text-[10px] text-muted-foreground capitalize">{engine}</span>
                    </motion.div>
                  ))}
                </div>

              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Citeplex — AI Search Visibility · 7 Engines · Daily Tracking · Half the Price
        </p>
      </div>
    </div>
  );
}
