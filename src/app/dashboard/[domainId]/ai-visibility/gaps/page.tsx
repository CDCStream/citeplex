"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Target,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { Favicon } from "@/components/ui/favicon";
import { EngineIcon } from "@/components/ui/engine-icon";

interface Gap {
  promptId: string;
  promptText: string;
  engine: string;
  competitor: string;
  competitorUrl: string;
  competitorPosition: number | null;
}

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  claude: "Claude",
  deepseek: "DeepSeek",
  grok: "Grok",
  mistral: "Mistral",
};

export default function GapsPage() {
  const params = useParams();
  const domainId = params.domainId as string;

  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ai-visibility/${domainId}/gaps`)
      .then((r) => r.json())
      .then((data) => setGaps(data.gaps || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [domainId]);

  const grouped = new Map<string, Gap[]>();
  for (const gap of gaps) {
    const key = `${gap.promptId}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(gap);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/${domainId}/ai-visibility`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Competitor Gaps
            </h1>
            <p className="text-sm text-muted-foreground">
              Prompts where competitors are mentioned but you are not
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {!loading && gaps.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No gaps found</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
              Great job! There are no prompts where competitors are mentioned
              but you are not.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading &&
        [...grouped.entries()].map(([promptId, gapItems]) => (
          <Card key={promptId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">
                    {gapItems[0].promptText}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {gapItems.length} competitor mention
                    {gapItems.length !== 1 ? "s" : ""} where you are absent
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link
                    href={`/dashboard/${domainId}/content/write?title=${encodeURIComponent(`How to rank for: ${gapItems[0].promptText}`)}&keyword=${encodeURIComponent(gapItems[0].promptText)}`}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Close This Gap
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {gapItems.map((gap, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                >
                  <Favicon url={gap.competitorUrl} size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{gap.competitor}</div>
                    <div className="text-xs text-muted-foreground">
                      {gap.competitorUrl}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EngineIcon engine={gap.engine} size={16} />
                    <span className="text-xs text-muted-foreground">
                      {ENGINE_LABELS[gap.engine] || gap.engine}
                    </span>
                    {gap.competitorPosition !== null && (
                      <Badge variant="outline" className="text-[10px]">
                        #{gap.competitorPosition}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
