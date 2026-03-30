"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { PromptMover } from "@/lib/scan/get-domain-stats";

interface Props {
  topMovers: {
    risers: PromptMover[];
    decliners: PromptMover[];
  };
}

function MetricLabel({ metric }: { metric: "mentionRate" | "rank" }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {metric === "mentionRate" ? "Mention Rate" : "Avg. Rank"}
    </span>
  );
}

function formatValue(mover: PromptMover) {
  if (mover.metric === "mentionRate") {
    return { prev: `${mover.previousValue}%`, curr: `${mover.currentValue}%` };
  }
  return { prev: `#${mover.previousValue}`, curr: `#${mover.currentValue}` };
}

function MoverCard({
  mover,
  type,
}: {
  mover: PromptMover;
  type: "riser" | "decliner";
}) {
  const isRiser = type === "riser";
  const { prev, curr } = formatValue(mover);
  const absChange = Math.abs(mover.changePercent);

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isRiser
            ? "bg-green-500/10 text-green-600"
            : "bg-red-500/10 text-red-600"
        }`}
      >
        {isRiser ? (
          <ArrowUpRight className="h-4 w-4" />
        ) : (
          <ArrowDownRight className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">
          {mover.promptText}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <MetricLabel metric={mover.metric} />
          <span className="text-xs text-muted-foreground">
            {prev} → {curr}
          </span>
          <span
            className={`text-xs font-semibold ${
              isRiser ? "text-green-600" : "text-red-600"
            }`}
          >
            {isRiser ? "+" : ""}
            {mover.changePercent}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function PromptMovers({ topMovers }: Props) {
  if (topMovers.risers.length === 0 && topMovers.decliners.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Risers */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold">Top Rising</h3>
          </div>
          {topMovers.risers.length > 0 ? (
            <div className="space-y-2">
              {topMovers.risers.map((m) => (
                <MoverCard key={`${m.promptId}-${m.metric}`} mover={m} type="riser" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No rising prompts detected yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Decliners */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <h3 className="text-sm font-semibold">Top Declining</h3>
          </div>
          {topMovers.decliners.length > 0 ? (
            <div className="space-y-2">
              {topMovers.decliners.map((m) => (
                <MoverCard key={`${m.promptId}-${m.metric}`} mover={m} type="decliner" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No declining prompts detected yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
