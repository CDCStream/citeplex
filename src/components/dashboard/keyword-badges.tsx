"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BarChart3, Target } from "lucide-react";

interface KeywordData {
  promptId: string;
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  trafficPotential: number | null;
  globalVolume: number | null;
  parentTopic: string | null;
}

function formatVolume(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

function getDifficultyColor(kd: number | null): string {
  if (kd === null) return "bg-muted text-muted-foreground";
  if (kd <= 10) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (kd <= 30) return "bg-green-500/15 text-green-700 dark:text-green-400";
  if (kd <= 50) return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400";
  if (kd <= 70) return "bg-orange-500/15 text-orange-700 dark:text-orange-400";
  return "bg-red-500/15 text-red-700 dark:text-red-400";
}

function getDifficultyLabel(kd: number | null): string {
  if (kd === null) return "N/A";
  if (kd <= 10) return "Easy";
  if (kd <= 30) return "Medium";
  if (kd <= 50) return "Hard";
  if (kd <= 70) return "Very Hard";
  return "Super Hard";
}

export function KeywordBadges({ domainId }: { domainId: string }) {
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/ai-visibility/${domainId}/keywords`)
      .then((r) => r.json())
      .then((data) => {
        setKeywords(data.keywords || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [domainId]);

  if (!loaded || keywords.length === 0) return null;

  return { keywords, loaded };
}

export function PromptKeywordBadge({
  promptId,
  keywords,
}: {
  promptId: string;
  keywords: KeywordData[];
}) {
  const kw = keywords.find((k) => k.promptId === promptId);
  if (!kw || (kw.volume === null && kw.difficulty === null)) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5 mt-1">
        {kw.volume !== null && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1">
                <BarChart3 className="h-2.5 w-2.5" />
                {formatVolume(kw.volume)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Monthly search volume: {kw.volume?.toLocaleString()}</p>
              {kw.globalVolume !== null && (
                <p className="text-xs text-muted-foreground">
                  Global: {kw.globalVolume.toLocaleString()}
                </p>
              )}
              {kw.trafficPotential !== null && (
                <p className="text-xs text-muted-foreground">
                  Traffic potential: {kw.trafficPotential.toLocaleString()}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
        {kw.difficulty !== null && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 h-5 gap-1 border-0 ${getDifficultyColor(kw.difficulty)}`}
              >
                <Target className="h-2.5 w-2.5" />
                KD {kw.difficulty}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Keyword Difficulty: {kw.difficulty} ({getDifficultyLabel(kw.difficulty)})
              </p>
              {kw.parentTopic && (
                <p className="text-xs text-muted-foreground">
                  Parent topic: {kw.parentTopic}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
