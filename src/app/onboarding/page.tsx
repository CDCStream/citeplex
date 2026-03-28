"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  ShieldCheck,
  Building2,
  Users,
  Loader2,
  X,
  Plus,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  CheckCircle2,
  Mail,
  RefreshCw,
  MessageSquareText,
} from "lucide-react";
import { COUNTRIES, countryFlag } from "@/lib/constants/countries";
import { Favicon } from "@/components/ui/favicon";
import { SignupConversion } from "@/app/dashboard/signup-conversion";
import { EngineIcon } from "@/components/ui/engine-icon";

const SCAN_ENGINES = ["chatgpt", "perplexity", "gemini", "claude", "deepseek", "grok", "mistral"] as const;
const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  claude: "Claude",
  deepseek: "DeepSeek",
  grok: "Grok",
  mistral: "Mistral",
};

const STEPS = [
  { label: "Website", icon: Globe },
  { label: "Verify", icon: ShieldCheck },
  { label: "Brand", icon: Building2 },
  { label: "Competitors", icon: Users },
  { label: "Prompts", icon: MessageSquareText },
];

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

  // Step 0: URL
  const [url, setUrl] = useState("");

  // Step 1: Domain verification
  const [emailLocal, setEmailLocal] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [domainVerified, setDomainVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyError, setVerifyError] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const domainHostname = useMemo(() => {
    try {
      return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }, [url]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 2: Brand details + Country
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [primaryCountry, setPrimaryCountry] = useState("US");
  const [targetCountries, setTargetCountries] = useState<string[]>(["US"]);

  // Step 3: Competitors
  const [competitors, setCompetitors] = useState<CompetitorItem[]>([]);
  const [newCompetitorUrl, setNewCompetitorUrl] = useState("");

  // Step 4: AI Visibility Prompts
  interface PromptItem {
    text: string;
    category: string;
    language?: string;
    country?: string;
    selected: boolean;
  }
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [newPromptText, setNewPromptText] = useState("");
  const [promptsGenerated, setPromptsGenerated] = useState(false);
  const [promptLimit, setPromptLimit] = useState(15);

  const CATEGORY_LABELS: Record<string, string> = {
    best: "Best Of",
    howto: "How To",
    comparison: "Comparison",
    recommendation: "Recommendation",
    problem: "Problem Solving",
    custom: "Custom",
  };

  const selectedCount = prompts.filter((p) => p.selected).length;

  const groupedPrompts = useMemo(() => {
    const groups: Record<string, { prompt: PromptItem; index: number }[]> = {};
    prompts.forEach((p, i) => {
      const cat = p.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ prompt: p, index: i });
    });
    return groups;
  }, [prompts]);

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

  const [analyzeError, setAnalyzeError] = useState("");

  async function handleAnalyze() {
    if (!url.trim()) return;
    setLoading(true);
    setAnalyzeError("");
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
        setStep(1);
      } else {
        setAnalyzeError(data.error || "Could not analyze website. Please try again.");
      }
    } catch {
      setAnalyzeError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendVerification() {
    if (!emailLocal.trim() || !domainHostname) return;
    setSendingCode(true);
    setVerifyError("");
    try {
      const email = `${emailLocal.trim()}@${domainHostname}`;
      const res = await fetch("/api/onboarding/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainUrl: url, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Failed to send code");
        return;
      }
      setVerificationSent(true);
      setResendCooldown(60);
    } catch {
      setVerifyError("Failed to send verification code");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleVerifyCode() {
    if (verificationCode.length !== 6) return;
    setVerifyingCode(true);
    setVerifyError("");
    try {
      const email = `${emailLocal.trim()}@${domainHostname}`;
      const res = await fetch("/api/onboarding/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainUrl: url, email, code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Verification failed");
        return;
      }
      setDomainVerified(true);
      setTimeout(() => setStep(2), 800);
    } catch {
      setVerifyError("Verification failed");
    } finally {
      setVerifyingCode(false);
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

  const [promptError, setPromptError] = useState("");

  async function handleGeneratePrompts() {
    setLoading(true);
    setPromptError("");
    try {
      const countryInputs = targetCountries.map((code) => {
        const c = getCountryObj(code);
        return { code, lang: c?.lang || "en", langName: c?.langName || "English" };
      });

      const res = await fetch("/api/onboarding/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          description,
          industry,
          countries: countryInputs,
        }),
      });
      const data = await res.json();
      if (res.ok && data.suggestions?.length > 0) {
        const limit = data.promptLimit || 15;
        setPromptLimit(limit);
        setPrompts(
          data.suggestions.map((s: { text: string; category: string; language?: string; country?: string }, i: number) => ({
            ...s,
            selected: false,
          }))
        );
      } else {
        setPromptError("Could not generate suggestions. You can add prompts manually below.");
      }
    } catch {
      setPromptError("Network error generating prompts. You can add prompts manually.");
    } finally {
      setPromptsGenerated(true);
      setLoading(false);
      setStep(4);
    }
  }

  async function handleRegeneratePrompts() {
    setPrompts([]);
    setPromptsGenerated(false);
    setPromptError("");
    await handleGeneratePrompts();
  }

  function togglePrompt(index: number) {
    setPrompts((prev) => {
      const target = prev[index];
      if (!target.selected && prev.filter((p) => p.selected).length >= promptLimit) {
        return prev;
      }
      return prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p));
    });
  }

  function addCustomPrompt() {
    const text = newPromptText.trim();
    if (!text) return;
    setPrompts((prev) => [
      ...prev,
      { text, category: "custom", selected: true },
    ]);
    setNewPromptText("");
  }

  function removePrompt(index: number) {
    setPrompts((prev) => prev.filter((_, i) => i !== index));
  }

  const [finishPhase, setFinishPhase] = useState<"" | "saving" | "scanning" | "planning" | "done">("");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanDetail, setScanDetail] = useState<{ completed: number; total: number } | null>(null);
  const [planProgress, setPlanProgress] = useState(0);
  const [createdDomainId, setCreatedDomainId] = useState("");
  const [activeEngineIdx, setActiveEngineIdx] = useState(0);

  useEffect(() => {
    if (finishPhase !== "scanning") return;
    const iv = setInterval(() => {
      setActiveEngineIdx((i) => (i + 1) % SCAN_ENGINES.length);
    }, 600);
    return () => clearInterval(iv);
  }, [finishPhase]);

  async function handleFinish() {
    setSaving(true);
    setFinishPhase("saving");
    try {
      const selectedPrompts = prompts
        .filter((p) => p.selected)
        .map(({ text, category, language, country }) => ({
          text,
          category,
          language,
          country,
        }));

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
          competitors,
          prompts: selectedPrompts,
        }),
      });
      const data = await res.json();
      if (res.ok && data.domainId) {
        setCreatedDomainId(data.domainId);
        setStep(5);

        // Phase 1: AI Visibility Scan (fire & poll)
        setFinishPhase("scanning");
        fetch(`/api/scan/${data.domainId}`, { method: "POST" }).catch(() => {});

        await new Promise<void>((resolve) => {
          const poll = setInterval(async () => {
            try {
              const sr = await fetch(`/api/scan-status/${data.domainId}`, { cache: "no-store" });
              const sd = await sr.json();
              if (sd.progress) {
                setScanDetail(sd.progress);
                const pct = sd.progress.total > 0
                  ? (sd.progress.completed / sd.progress.total) * 100
                  : 0;
                setScanProgress(Math.min(pct, 99));
              }
              if (sd.status === "completed") {
                clearInterval(poll);
                setScanProgress(100);
                setScanDetail((prev) => prev ? { ...prev, completed: prev.total } : prev);
                resolve();
              }
            } catch { /* retry next tick */ }
          }, 2500);
        });

        await new Promise((r) => setTimeout(r, 600));

        // Phase 2: Keyword Planning (fire & poll)
        setFinishPhase("planning");
        fetch(`/api/content/${data.domainId}/plan-keywords`, { method: "POST" }).catch(() => {});

        await new Promise<void>((resolve) => {
          let ticks = 0;
          const poll = setInterval(async () => {
            ticks++;
            try {
              const kr = await fetch(`/api/content/${data.domainId}/plan-keywords`, { cache: "no-store" });
              const kd = await kr.json();
              if (kd.status === "done" || kd.status === "none") {
                clearInterval(poll);
                setPlanProgress(100);
                resolve();
              } else {
                setPlanProgress(Math.min(ticks * 8, 92));
              }
            } catch {
              setPlanProgress(Math.min(ticks * 8, 92));
            }
          }, 3000);
        });

        setFinishPhase("done");
        await new Promise((r) => setTimeout(r, 1000));
        window.location.href = `/dashboard/${data.domainId}`;
      }
    } catch {
      setFinishPhase("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Suspense fallback={null}>
        <SignupConversion />
      </Suspense>
    <div className="min-h-screen bg-linear-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
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

                {analyzeError && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                    {analyzeError}
                  </div>
                )}

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

            {/* Step 1: Verify domain ownership */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  {url && <Favicon url={url} size={32} />}
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Verify domain ownership</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      We&apos;ll send a verification code to your domain email.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Your email at this domain</Label>
                    <div className="flex items-stretch">
                      <Input
                        placeholder="name"
                        value={emailLocal}
                        onChange={(e) => {
                          setEmailLocal(e.target.value);
                          setVerifyError("");
                        }}
                        disabled={domainVerified}
                        className="min-w-0 flex-1 rounded-r-none border-r-0"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !verificationSent) handleSendVerification();
                        }}
                      />
                      <div className="flex shrink-0 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap">
                        @{domainHostname}
                      </div>
                    </div>
                  </div>

                  {!verificationSent && !domainVerified && (
                    <Button
                      onClick={handleSendVerification}
                      disabled={!emailLocal.trim() || sendingCode}
                      className="w-full"
                    >
                      {sendingCode ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Verification Code
                        </>
                      )}
                    </Button>
                  )}

                  {verificationSent && !domainVerified && (
                    <div className="space-y-4">
                      <div className="rounded-lg border bg-muted/50 p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Code sent to <span className="font-semibold text-foreground">{emailLocal}@{domainHostname}</span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Enter 6-digit code</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="000000"
                            value={verificationCode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                              setVerificationCode(val);
                              setVerifyError("");
                            }}
                            maxLength={6}
                            className="text-center text-lg font-mono tracking-[0.3em]"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && verificationCode.length === 6) handleVerifyCode();
                            }}
                          />
                          <Button
                            onClick={handleVerifyCode}
                            disabled={verificationCode.length !== 6 || verifyingCode}
                            className="shrink-0"
                          >
                            {verifyingCode ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSendVerification}
                        disabled={resendCooldown > 0 || sendingCode}
                        className="w-full text-xs"
                      >
                        <RefreshCw className="mr-1.5 h-3 w-3" />
                        {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
                      </Button>
                    </div>
                  )}

                  {domainVerified && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5 p-4 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                          Domain verified!
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500">
                          Proceeding to the next step...
                        </p>
                      </div>
                    </div>
                  )}

                  {verifyError && (
                    <p className="text-sm text-destructive text-center">{verifyError}</p>
                  )}
                </div>

                <Button variant="outline" onClick={() => setStep(0)} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
            )}

            {/* Step 2: Confirm brand details + Country selection */}
            {step === 2 && (
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
                      Markets you want to track AI visibility in.
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
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleFindCompetitors}
                    disabled={!brandName.trim() || targetCountries.length === 0 || loading}
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
                    onClick={handleGeneratePrompts}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Prompts...
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

            {/* Step 4: AI Visibility Prompts */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  {url && <Favicon url={url} size={28} />}
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">AI Visibility Prompts</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      Select the prompts we&apos;ll track across 7 AI engines daily.
                    </p>
                  </div>
                </div>

                {/* Prompt quota bar */}
                {promptsGenerated && (
                  <div className="rounded-lg border bg-muted/30 px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">
                        {selectedCount} / {promptLimit} prompts selected
                      </span>
                      <div className="flex gap-1.5">
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          selectedCount >= promptLimit ? "bg-amber-500" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(100, (selectedCount / promptLimit) * 100)}%` }}
                      />
                    </div>
                    {selectedCount >= promptLimit && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        Prompt limit reached. Deselect a prompt to add a new one.
                      </p>
                    )}
                  </div>
                )}

                {!promptsGenerated && (
                  <div className="rounded-lg border bg-muted/50 p-6 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Generating prompt suggestions...</p>
                  </div>
                )}

                {promptError && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-400">
                    {promptError}
                  </div>
                )}

                {/* Grouped prompts by category */}
                {promptsGenerated && prompts.length > 0 && (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {Object.entries(groupedPrompts).map(([cat, items]) => (
                      <div key={cat}>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                          {CATEGORY_LABELS[cat] || cat}
                          <span className="text-[10px] font-normal bg-muted px-1.5 py-0.5 rounded-full">
                            {items.filter((it) => it.prompt.selected).length}/{items.length}
                          </span>
                        </h3>
                        <div className="space-y-1">
                          {items.map(({ prompt, index }) => (
                            <div
                              key={index}
                              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                                prompt.selected
                                  ? "border-primary/30 bg-primary/5"
                                  : "border-transparent bg-muted/20 opacity-50"
                              } ${
                                !prompt.selected && selectedCount >= promptLimit
                                  ? "cursor-not-allowed"
                                  : ""
                              }`}
                              onClick={() => togglePrompt(index)}
                            >
                              <div
                                className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                                  prompt.selected
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-muted-foreground/30"
                                }`}
                              >
                                {prompt.selected && <Check className="h-3 w-3" />}
                              </div>
                              <span className="flex-1 min-w-0 leading-snug">{prompt.text}</span>
                              {prompt.country && (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {flag(prompt.country)}
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePrompt(index);
                                }}
                                className="text-muted-foreground/40 hover:text-destructive shrink-0"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCount < promptLimit && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a custom prompt..."
                      value={newPromptText}
                      onChange={(e) => setNewPromptText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomPrompt()}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={addCustomPrompt}
                      disabled={!newPromptText.trim()}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1" disabled={!!finishPhase}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={saving || selectedCount === 0 || !!finishPhase}
                    className="flex-1"
                  >
                    {finishPhase === "saving" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Finish & Start Setup
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Setup Loading Screens */}
            {step === 5 && (
              <div className="space-y-8 py-4">
                <div className="text-center">
                  <h1 className="text-2xl font-bold tracking-tight">Setting up your workspace</h1>
                  <p className="text-muted-foreground mt-1 text-sm">
                    This runs in the background — you can close this page safely.
                  </p>
                </div>

                {/* AI Visibility Scan */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {scanProgress >= 100 ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : finishPhase === "scanning" || finishPhase === "planning" || finishPhase === "done" ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI Visibility Scan</p>
                      <p className="text-xs text-muted-foreground">
                        {scanDetail
                          ? `${scanDetail.completed} / ${scanDetail.total} queries completed`
                          : `Scanning ${selectedCount} prompts across ${SCAN_ENGINES.length} AI engines`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {Math.round(scanProgress)}%
                    </span>
                  </div>

                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        scanProgress >= 100 ? "bg-emerald-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.max(scanProgress, 2)}%` }}
                    />
                  </div>

                  {/* AI Engine Logos */}
                  {(finishPhase === "scanning" || scanProgress >= 100) && (
                    <div className="flex justify-center gap-3">
                      {SCAN_ENGINES.map((engine, i) => (
                        <div key={engine} className="flex flex-col items-center gap-1.5">
                          <div
                            className={`rounded-full p-1.5 ring-1 transition-all duration-300 ${
                              scanProgress >= 100
                                ? "bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-200 dark:ring-emerald-500/30"
                                : i === activeEngineIdx
                                  ? "bg-primary/10 ring-primary/40 scale-110"
                                  : "bg-white/60 dark:bg-white/10 ring-gray-200/50 dark:ring-gray-600/30 opacity-50"
                            }`}
                          >
                            <EngineIcon engine={engine} size={20} />
                          </div>
                          <span className={`text-[9px] transition-colors duration-300 ${
                            scanProgress >= 100
                              ? "text-emerald-600 dark:text-emerald-400 font-medium"
                              : i === activeEngineIdx
                                ? "text-primary font-medium"
                                : "text-muted-foreground"
                          }`}>
                            {ENGINE_LABELS[engine]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Keyword Planning */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {planProgress >= 100 ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : finishPhase === "planning" || finishPhase === "done" ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">30-Day Content Strategy</p>
                      <p className="text-xs text-muted-foreground">
                        Analyzing competitors, Ahrefs data & backlink opportunities
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {Math.round(planProgress)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        planProgress >= 100 ? "bg-emerald-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.max(planProgress, planProgress > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>

                {finishPhase === "done" && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5 p-4 text-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                      All set! Redirecting to your dashboard...
                    </p>
                  </div>
                )}

                {(finishPhase === "planning" || finishPhase === "scanning") && (
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (createdDomainId) window.location.href = `/dashboard/${createdDomainId}`;
                      }}
                      className="text-xs text-muted-foreground"
                    >
                      Skip & go to dashboard →
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Citeplex — Boost your SEO, AEO & GEO from one platform
        </p>
      </div>
    </div>
    </>
  );
}
