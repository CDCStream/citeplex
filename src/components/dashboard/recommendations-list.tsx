"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Check, X } from "lucide-react";
import { updateRecommendationStatus } from "@/app/actions/recommendation";
interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: Date;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  implemented: "Done",
  dismissed: "Dismissed",
};

export function RecommendationsList({
  recommendations,
  domainId,
}: {
  recommendations: Recommendation[];
  domainId: string;
}) {
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Lightbulb className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No recommendations yet</h3>
          <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
            Run a scan first — recommendations will be generated based on your
            visibility results.
          </p>
        </CardContent>
      </Card>
    );
  }

  const pending = recommendations.filter((r) => r.status === "pending");
  const completed = recommendations.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Action Items ({pending.length})
          </h2>
          {pending.map((rec) => (
            <Card key={rec.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{rec.title}</h3>
                      <Badge variant="outline" className={PRIORITY_COLORS[rec.priority]}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{rec.description}</p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRecommendationStatus(rec.id, domainId, "implemented")}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateRecommendationStatus(rec.id, domainId, "dismissed")}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Completed ({completed.length})
          </h2>
          {completed.map((rec) => (
            <Card key={rec.id} className="opacity-60">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold line-through">{rec.title}</h3>
                      <Badge variant="secondary">
                        {STATUS_LABELS[rec.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
