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
} from "lucide-react";
import { COUNTRIES, countryFlag } from "@/lib/constants/countries";
import { Favicon } from "@/components/ui/favicon";
import { SignupConversion } from "@/app/dashboard/signup-conversion";

const STEPS = [
  { label: "Website", icon: Globe },
  { label: "Verify", icon: ShieldCheck },
  { label: "Brand", icon: Building2 },
  { label: "Competitors", icon: Users },
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
          competitors,
        }),
      });
      const data = await res.json();
      if (res.ok && data.domainId) {
        window.location.href = `/dashboard/${data.domainId}`;
      }
    } catch {
      // stay on page
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
                        Finish & Go to Dashboard
                      </>
                    )}
                  </Button>
                </div>
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
