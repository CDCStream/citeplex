"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Loader2,
  X,
  Plus,
  Check,
  Sparkles,
  ArrowUpRight,
  Radio,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  best: "Best & Top",
  howto: "How-To",
  comparison: "Comparison",
  recommendation: "Recommendation",
  problem: "Problem Solving",
  general: "General",
};

interface PromptItem {
  text: string;
  category: string;
  language?: string;
  country?: string;
}

export function AiVisibilitySetup({
  domainId,
  brandName,
  description,
  industry,
  primaryCountry,
  targetCountries,
  promptLimit,
  totalPromptsUsed,
}: {
  domainId: string;
  brandName: string;
  description: string;
  industry: string;
  primaryCountry: string;
  targetCountries: string[];
  promptLimit: number;
  totalPromptsUsed: number;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "select" | "saving">("intro");
  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<PromptItem[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
    new Set()
  );
  const [customPrompts, setCustomPrompts] = useState<PromptItem[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [analyzingPrompt, setAnalyzingPrompt] = useState(false);

  const totalSelected = selectedIndexes.size + customPrompts.length;
  const maxSelectable = Math.max(0, promptLimit - totalPromptsUsed);
  const remainingPrompts = Math.max(0, maxSelectable - totalSelected);
  const isAtLimit = remainingPrompts <= 0;

  const selectedPrompts: PromptItem[] = useMemo(() => {
    const fromSuggestions = [...selectedIndexes]
      .sort((a, b) => a - b)
      .map((i) => suggestions[i]);
    return [...fromSuggestions, ...customPrompts];
  }, [suggestions, selectedIndexes, customPrompts]);

  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, { item: PromptItem; index: number }[]> = {};
    suggestions.forEach((item, index) => {
      const cat = item.category || "general";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ item, index });
    });
    return groups;
  }, [suggestions]);

  async function handleGeneratePrompts() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          description,
          industry,
          countries: targetCountries.map((code) => ({
            code,
            lang: code.toLowerCase(),
            langName: code,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.suggestions) {
        setSuggestions(data.suggestions);
        setSelectedIndexes(new Set());
        setCustomPrompts([]);
      }
      setPhase("select");
    } catch {
      setPhase("select");
    } finally {
      setLoading(false);
    }
  }

  function toggleSuggestion(index: number) {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        if (totalSelected >= maxSelectable) return prev;
        next.add(index);
      }
      return next;
    });
  }

  async function addCustomPrompt() {
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
      setCustomPrompts((prev) => [
        ...prev,
        {
          text,
          category: data.category || "general",
          language: data.language || "en",
          country: data.country || primaryCountry,
        },
      ]);
    } catch {
      setCustomPrompts((prev) => [
        ...prev,
        { text, category: "general" },
      ]);
    } finally {
      setAnalyzingPrompt(false);
    }
  }

  function removeCustomPrompt(index: number) {
    setCustomPrompts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleStartTracking() {
    if (selectedPrompts.length === 0) return;
    setPhase("saving");
    try {
      const res = await fetch(`/api/ai-visibility/${domainId}/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts: selectedPrompts }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      setPhase("select");
    }
  }

  if (phase === "intro") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              AI Visibility (AEO, GEO)
            </h1>
            <p className="text-sm text-muted-foreground">
              Track how AI engines mention {brandName} across prompts.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-2xl bg-primary/10 p-4 mb-4">
              <Eye className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">
              Set up AI Visibility Tracking
            </h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-lg">
              Choose the prompts and keywords your potential customers might ask
              AI assistants. We&apos;ll scan 7 AI engines daily and track your
              brand&apos;s mentions, positions, sentiment, and provide
              actionable insights.
            </p>
            <Button onClick={handleGeneratePrompts} disabled={loading} size="lg" className="mt-6">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Started
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "saving") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              AI Visibility (AEO, GEO)
            </h1>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Radio className="h-10 w-10 text-primary animate-pulse mb-4" />
            <h3 className="text-lg font-semibold">
              Setting up tracking...
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Saving your prompts and starting the first scan.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Eye className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Select Tracking Prompts
          </h1>
          <p className="text-sm text-muted-foreground">
            Pick the queries you want to track across 7 AI engines.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2.5">
        <span className="text-sm text-muted-foreground">
          Selected:{" "}
          <span className="font-semibold text-foreground">
            {totalSelected}
          </span>{" "}
          / {maxSelectable}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            remainingPrompts === 0
              ? "bg-destructive/10 text-destructive"
              : remainingPrompts <= 2
                ? "bg-amber-500/10 text-amber-600"
                : "bg-emerald-500/10 text-emerald-600"
          }`}
        >
          {remainingPrompts} remaining
        </span>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {Object.entries(groupedSuggestions).map(([category, items]) => (
          <div key={category} className="space-y-1.5">
            <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {CATEGORY_LABELS[category] || category}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            {items.map(({ item, index }) => {
              const isSelected = selectedIndexes.has(index);
              const isDisabled = !isSelected && isAtLimit;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleSuggestion(index)}
                  disabled={isDisabled}
                  className={`flex items-center gap-3 w-full rounded-lg border p-3 text-sm text-left transition-colors ${
                    isSelected
                      ? "border-primary/50 bg-primary/5"
                      : isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  {item.country && (
                    <span className="shrink-0 inline-flex items-center justify-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground leading-none">
                      {item.country}
                    </span>
                  )}
                  <span className="flex-1 min-w-0">{item.text}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {customPrompts.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Custom
          </span>
          {customPrompts.map((p, i) => (
            <div
              key={`custom-${i}`}
              className="flex items-center gap-3 rounded-lg border border-primary/50 bg-primary/5 p-3 text-sm"
            >
              <div className="shrink-0 h-5 w-5 rounded border-2 border-primary bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="flex-1 min-w-0">{p.text}</span>
              <button
                onClick={() => removeCustomPrompt(i)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isAtLimit ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-4 text-center space-y-2">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
            You&apos;ve reached your prompt limit ({maxSelectable} prompts)
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500">
            Deselect some prompts or{" "}
            <Link
              href="/pricing"
              className="underline font-semibold hover:text-amber-800 dark:hover:text-amber-300"
            >
              upgrade your plan
            </Link>{" "}
            to select more.
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
                addCustomPrompt();
              }
            }}
            rows={2}
            disabled={analyzingPrompt}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={addCustomPrompt}
            disabled={!newPrompt.trim() || analyzingPrompt}
            className="shrink-0 h-10 w-10"
          >
            {analyzingPrompt ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
      {analyzingPrompt && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Detecting language and category...
        </p>
      )}

      <Button
        onClick={handleStartTracking}
        disabled={selectedPrompts.length === 0}
        size="lg"
        className="w-full"
      >
        <Radio className="mr-2 h-4 w-4" />
        Start Tracking ({totalSelected} prompt{totalSelected !== 1 ? "s" : ""})
      </Button>
    </div>
  );
}
