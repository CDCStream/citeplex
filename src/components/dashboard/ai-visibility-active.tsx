"use client";

import { Eye, Clock, Loader2, Target } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VisibilityScoreCard } from "@/components/dashboard/visibility-score-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CompetitorChart } from "@/components/dashboard/competitor-chart";
import { PromptEngineMatrix } from "@/components/dashboard/prompt-engine-matrix";
import { ScanStatusBanner } from "@/components/dashboard/scan-status-banner";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { PromptList } from "@/components/dashboard/prompt-list";

interface Prompt {
  id: string;
  text: string;
  category: string | null;
  language: string | null;
  country: string | null;
  isActive: boolean;
  createdAt: Date;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface AiVisibilityActiveProps {
  domainId: string;
  brandName: string;
  prompts: Prompt[];
  promptLimit: number;
  totalPromptsUsed: number;
  hasScans: boolean;
  isScanning: boolean;
  stats: {
    mentionRate: number;
    avgPosition: number | null;
    sentimentBreakdown: { positive: number; negative: number; neutral: number };
    lastScan: string | null;
    engineBreakdown: { engine: string; mentionRate: number; avgPosition: number | null }[];
    promptResults: any[];
    dailyTrend: { date: string; mentionRate: number; avgPosition: number | null }[];
    trendRaw: any[];
    competitorTrendRaw: any[];
    competitorComparison: { name: string; url: string; mentionRate: number; avgPosition: number | null; isOwn: boolean }[];
  } | null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function AiVisibilityActive({
  domainId,
  brandName,
  prompts,
  promptLimit,
  totalPromptsUsed,
  hasScans,
  isScanning,
  stats,
}: AiVisibilityActiveProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              AI Visibility (AEO, GEO)
            </h1>
            <p className="text-sm text-muted-foreground">
              AI search engine tracking for {brandName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {stats?.lastScan && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Last scan: {stats.lastScan}
            </span>
          )}
          {isScanning && (
            <Badge variant="secondary" className="gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Scanning
            </Badge>
          )}
        </div>
      </div>

      <ScanStatusBanner
        domainId={domainId}
        initialStatus={isScanning ? "scanning" : "idle"}
        isFirstScan={!hasScans}
      />

      {isScanning && !hasScans && <AutoRefresh intervalMs={5000} />}

      {!hasScans && !isScanning && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">
              Waiting for first scan
            </h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
              Your first scan will run shortly. Results will appear here once
              complete.
            </p>
          </CardContent>
        </Card>
      )}

      {stats && (
        <>
          <VisibilityScoreCard
            mentionRate={stats.mentionRate}
            avgPosition={stats.avgPosition}
            sentimentBreakdown={stats.sentimentBreakdown}
            lastScan={stats.lastScan}
            engineBreakdown={stats.engineBreakdown}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <TrendChart
              data={stats.dailyTrend}
              trendRaw={stats.trendRaw}
              competitorTrendRaw={stats.competitorTrendRaw}
            />
            <CompetitorChart data={stats.competitorComparison} />
          </div>
          <PromptEngineMatrix rows={stats.promptResults} domainId={domainId} />
          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/${domainId}/ai-visibility/gaps`}>
                <Target className="mr-1.5 h-3.5 w-3.5" />
                View Competitor Gaps
              </Link>
            </Button>
          </div>
        </>
      )}

      <PromptList
        prompts={prompts}
        domainId={domainId}
        promptLimit={promptLimit}
        totalPromptsUsed={totalPromptsUsed}
      />
    </div>
  );
}
