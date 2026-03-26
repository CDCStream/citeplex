"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EngineIcon } from "@/components/ui/engine-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  ExternalLink,
  AlertTriangle,
  Lightbulb,
  Users,
  FileText,
  ThumbsDown,
} from "lucide-react";

interface KeySource {
  url: string;
  relevance: string;
}

interface Recommendation {
  action: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

interface InsightData {
  mentionContext?: string;
  whyMentioned?: string;
  sourceAnalysis?: {
    totalSources: number;
    brandInSources: number;
    competitorInSources: number;
    keySources: KeySource[];
  };
  competitorComparison?: string;
  recommendations?: Recommendation[];
  negativeMentionAnalysis?: {
    whyNegative: string;
    howToFix: string;
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanResultId: string | null;
  promptText: string;
  engine: string;
  mentioned: boolean;
  position: number | null;
  sentiment: "positive" | "negative" | "neutral" | null;
}

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT", perplexity: "Perplexity", gemini: "Gemini",
  claude: "Claude", deepseek: "DeepSeek", grok: "Grok", mistral: "Mistral",
};

const CONTEXT_LABELS: Record<string, { label: string; color: string }> = {
  top_pick: { label: "Top Pick", color: "bg-green-500/15 text-green-600 border-green-500/30" },
  alternative: { label: "Alternative", color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  comparison: { label: "In Comparison", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  passing_mention: { label: "Passing Mention", color: "bg-gray-500/15 text-gray-600 border-gray-500/30" },
  not_mentioned: { label: "Not Mentioned", color: "bg-red-500/15 text-red-600 border-red-500/30" },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/15 text-red-600 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  low: "bg-blue-500/15 text-blue-600 border-blue-500/30",
};

export function InsightModal({
  open,
  onOpenChange,
  scanResultId,
  promptText,
  engine,
  mentioned,
  position,
  sentiment,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !scanResultId) return;
    setLoading(true);
    setError("");
    setInsight(null);

    fetch(`/api/insights/${scanResultId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.insight) {
          setInsight(data.insight);
        } else {
          setError("Insight not generated yet. It will be available after the next scan.");
        }
      })
      .catch(() => setError("Failed to load insight"))
      .finally(() => setLoading(false));
  }, [open, scanResultId]);

  const ctx = CONTEXT_LABELS[insight?.mentionContext ?? ""] ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <EngineIcon engine={engine} size={24} />
            <DialogTitle className="text-base">{ENGINE_LABELS[engine] || engine}</DialogTitle>
            {mentioned ? (
              <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-xs">Mentioned</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Not Mentioned</Badge>
            )}
            {position !== null && (
              <Badge variant="outline" className="text-xs">#{position}</Badge>
            )}
            {sentiment && (
              <Badge className={`text-xs ${
                sentiment === "positive" ? "bg-green-500/15 text-green-600 border-green-500/30" :
                sentiment === "negative" ? "bg-red-500/15 text-red-600 border-red-500/30" :
                "bg-gray-500/15 text-gray-600 border-gray-500/30"
              }`}>
                {sentiment}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            <span className="font-medium text-foreground">Prompt:</span> {promptText}
          </p>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-amber-700 dark:text-amber-400">{error}</p>
          </div>
        )}

        {insight && (
          <div className="space-y-5 mt-2">
            {/* Section 1: Why mentioned */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-sm">
                    {mentioned ? "Why did this AI engine rank your brand?" : "Why did this AI engine not rank your brand?"}
                  </h3>
                  {ctx && (
                    <Badge className={`text-[10px] ${ctx.color}`}>{ctx.label}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insight.whyMentioned}
                </p>
              </CardContent>
            </Card>

            {/* Section 2: Sources */}
            {insight.sourceAnalysis && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <h3 className="font-semibold text-sm">Sources Used</h3>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {insight.sourceAnalysis.brandInSources}/{insight.sourceAnalysis.totalSources} mention your brand
                    </span>
                  </div>
                  {insight.sourceAnalysis.keySources?.length > 0 ? (
                    <div className="space-y-2">
                      {insight.sourceAnalysis.keySources.map((src, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm rounded-lg bg-muted/50 p-2.5">
                          <ExternalLink className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                          <div>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline break-all"
                            >
                              {src.url}
                            </a>
                            <p className="text-xs text-muted-foreground mt-0.5">{src.relevance}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No specific sources detected.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Section 3: Competitor comparison */}
            {insight.competitorComparison && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-purple-500" />
                    <h3 className="font-semibold text-sm">Competitor Comparison</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.competitorComparison}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Section 3b: Negative mention analysis */}
            {insight.negativeMentionAnalysis && (
              <Card className="border-red-200 dark:border-red-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsDown className="h-4 w-4 text-red-500" />
                    <h3 className="font-semibold text-sm">Negative Mention Analysis</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-1">Why negative?</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {insight.negativeMentionAnalysis.whyNegative}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1">How to fix?</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {insight.negativeMentionAnalysis.howToFix}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section 4: Recommendations */}
            {insight.recommendations && insight.recommendations.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-green-500" />
                    <h3 className="font-semibold text-sm">What should you do?</h3>
                  </div>
                  <div className="space-y-2.5">
                    {insight.recommendations.map((rec, i) => (
                      <div key={i} className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[10px] ${PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS.medium}`}>
                            {rec.priority}
                          </Badge>
                          <span className="text-sm font-medium">{rec.action}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
