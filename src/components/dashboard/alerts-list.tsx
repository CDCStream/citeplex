"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, TrendingUp, CheckCheck } from "lucide-react";
import { markAlertRead, markAllAlertsRead } from "@/app/actions/alert";
interface Alert {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const ALERT_ICONS: Record<string, typeof AlertTriangle> = {
  score_drop: AlertTriangle,
  mention_drop: AlertTriangle,
  competitor_rise: TrendingUp,
};

const ALERT_COLORS: Record<string, string> = {
  score_drop: "text-red-500",
  mention_drop: "text-red-500",
  competitor_rise: "text-yellow-500",
};

export function AlertsList({ alerts, domainId }: { alerts: Alert[]; domainId: string }) {
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Bell className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No alerts yet</h3>
          <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
            Alerts will appear here when there are significant changes in your
            visibility scores.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAlertsRead(domainId)}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {alerts.map((alert) => {
          const Icon = ALERT_ICONS[alert.type] || AlertTriangle;
          return (
            <Card
              key={alert.id}
              className={alert.isRead ? "opacity-60" : ""}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${ALERT_COLORS[alert.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{alert.message}</p>
                      {!alert.isRead && (
                        <Badge variant="default" className="shrink-0 text-[10px] px-1.5 py-0">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString("en-US")} at{" "}
                        {new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {!alert.isRead && (
                        <button
                          className="text-xs text-primary hover:underline"
                          onClick={() => markAlertRead(alert.id)}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
