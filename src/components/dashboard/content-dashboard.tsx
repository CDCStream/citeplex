"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

interface ContentPlanItem {
  id: string;
  title: string;
  keyword: string | null;
  articleType: string | null;
  scheduledDate: string;
  status: string;
  articleId: string | null;
  keywordData: { volume?: number | null; difficulty?: number | null } | null;
}

const ARTICLE_TYPES = [
  { value: "guide", label: "Guide" },
  { value: "how-to", label: "How-To" },
  { value: "listicle", label: "Listicle" },
  { value: "comparison", label: "Comparison" },
  { value: "explainer", label: "Explainer" },
  { value: "round-up", label: "Round-Up" },
];

const TYPE_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  guide: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  "how-to": { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  listicle: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  comparison: { bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-700 dark:text-violet-400", dot: "bg-violet-500" },
  explainer: { bg: "bg-cyan-50 dark:bg-cyan-500/10", text: "text-cyan-700 dark:text-cyan-400", dot: "bg-cyan-500" },
  "round-up": { bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
};

const TYPE_FALLBACK = { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export function ContentDashboard({
  domainId,
  brandName,
  description,
  industry,
  plans,
  articlesUsed,
}: {
  domainId: string;
  brandName: string;
  description: string;
  industry: string;
  plans: ContentPlanItem[];
  articlesUsed: number;
  articleLimit: number;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const calendarDays = getCalendarDays(year, month);

  const plansByDay = new Map<number, ContentPlanItem[]>();
  for (const p of plans) {
    const d = new Date(p.scheduledDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!plansByDay.has(day)) plansByDay.set(day, []);
      plansByDay.get(day)!.push(p);
    }
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content</h1>
        <p className="text-sm text-muted-foreground">
          Plan, write, and publish AI-optimized articles for {brandName}
        </p>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {MONTHS[month]} {year}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {plans.filter(p => {
                const d = new Date(p.scheduledDate);
                return d.getFullYear() === year && d.getMonth() === month;
              }).length} articles planned this month
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b"
            >
              {wd}
            </div>
          ))}
          {calendarDays.map((day, i) => {
            const dayPlans = day ? plansByDay.get(day) || [] : [];
            const isToday =
              day === now.getDate() &&
              month === now.getMonth() &&
              year === now.getFullYear();
            const isWeekend = i % 7 >= 5;
            return (
              <div
                key={i}
                className={`min-h-[130px] p-2.5 border-b border-r transition-colors ${
                  !day ? "bg-muted/20" : isToday ? "bg-primary/[0.03]" : isWeekend ? "bg-muted/10" : ""
                } ${i % 7 === 0 ? "border-l" : ""}`}
              >
                {day && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-semibold ${
                          isToday
                            ? "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center shadow-sm"
                            : "text-muted-foreground/70"
                        }`}
                      >
                        {day}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-medium text-primary">Today</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {dayPlans.slice(0, 2).map((p) => {
                        const vol = p.keywordData?.volume;
                        const kd = p.keywordData?.difficulty;
                        const planDate = new Date(year, month, day!);
                        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const isFuture = planDate > todayDate;
                        const canClick = !isFuture || !!p.articleId;
                        const href = p.articleId
                          ? `/dashboard/${domainId}/content/article/${p.articleId}?tab=preview`
                          : `/dashboard/${domainId}/content/write?planId=${p.id}&title=${encodeURIComponent(p.title)}&keyword=${encodeURIComponent(p.keyword || "")}`;

                        const typeLabel = ARTICLE_TYPES.find(t => t.value === p.articleType)?.label || p.articleType;
                        const badge = TYPE_BADGE[p.articleType || ""] || TYPE_FALLBACK;

                        const content = (
                          <div className={`rounded-lg p-2 ${badge.bg} border border-transparent hover:border-border/50 transition-all`}>
                            {p.articleType && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                <span className={`text-[10px] font-semibold uppercase tracking-wide ${badge.text}`}>
                                  {typeLabel}
                                </span>
                              </div>
                            )}
                            <div className={`text-xs font-medium truncate ${p.articleId ? "text-foreground" : "text-foreground/80"}`}>
                              {p.keyword || p.title}
                            </div>
                            {(vol != null || kd != null) && (
                              <div className="flex items-center gap-2.5 mt-1.5">
                                {vol != null && (
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    <span className="text-foreground/60">{vol.toLocaleString("en-US")}</span> vol
                                  </span>
                                )}
                                {kd != null && (
                                  <span className={`text-[10px] font-semibold ${
                                    kd <= 20 ? "text-emerald-600 dark:text-emerald-400" :
                                    kd <= 50 ? "text-amber-600 dark:text-amber-400" :
                                    "text-red-600 dark:text-red-400"
                                  }`}>
                                    KD {kd}
                                  </span>
                                )}
                              </div>
                            )}
                            {p.articleId ? (
                              <div className="flex items-center gap-1 mt-1.5">
                                <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-400" />
                                <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">Preview</span>
                              </div>
                            ) : !isFuture && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <Pencil className="h-3 w-3 text-primary" />
                                <span className="text-[10px] font-semibold text-primary">Write</span>
                              </div>
                            )}
                          </div>
                        );

                        return canClick ? (
                          <Link key={p.id} href={href} className="block cursor-pointer">
                            {content}
                          </Link>
                        ) : (
                          <div key={p.id}>{content}</div>
                        );
                      })}
                      {dayPlans.length > 2 && (
                        <div className="text-[10px] font-medium text-muted-foreground text-center pt-0.5">
                          +{dayPlans.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-6 py-3 border-t bg-muted/20">
          {ARTICLE_TYPES.map(t => {
            const badge = TYPE_BADGE[t.value] || TYPE_FALLBACK;
            return (
              <div key={t.value} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                <span className="text-[11px] text-muted-foreground font-medium">{t.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming articles list */}
      {(() => {
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const upcomingPlans = plans.filter((p) => p.scheduledDate >= todayStr);
        return upcomingPlans.length > 0 ? (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b">
            <h2 className="text-lg font-bold tracking-tight">
              Upcoming Articles
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{upcomingPlans.length} articles scheduled</p>
          </div>
          <div className="divide-y">
            {upcomingPlans.map((p) => {
              const badge = TYPE_BADGE[p.articleType || ""] || TYPE_FALLBACK;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className={`w-1 h-10 rounded-full ${badge.dot} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{p.title}</div>
                    <div className="flex items-center gap-3 mt-1">
                      {p.keyword && (
                        <span className="text-xs text-muted-foreground">{p.keyword}</span>
                      )}
                      {p.articleType && (
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${badge.text}`}>
                          {ARTICLE_TYPES.find(t => t.value === p.articleType)?.label || p.articleType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {p.keywordData?.volume != null && (
                      <div className="text-center">
                        <div className="text-xs font-bold text-foreground">{p.keywordData.volume.toLocaleString("en-US")}</div>
                        <div className="text-[10px] text-muted-foreground">Volume</div>
                      </div>
                    )}
                    {p.keywordData?.difficulty != null && (
                      <div className="text-center">
                        <div className={`text-xs font-bold ${
                          p.keywordData.difficulty <= 20 ? "text-emerald-600 dark:text-emerald-400" :
                          p.keywordData.difficulty <= 50 ? "text-amber-600 dark:text-amber-400" :
                          "text-red-600 dark:text-red-400"
                        }`}>{p.keywordData.difficulty}</div>
                        <div className="text-[10px] text-muted-foreground">KD</div>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground w-20 text-right">
                      {new Date(p.scheduledDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    {p.articleId ? (
                      <Button variant="outline" size="sm" className="rounded-lg" asChild>
                        <Link href={`/dashboard/${domainId}/content/article/${p.articleId}?tab=preview`}>
                          <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                          Preview
                        </Link>
                      </Button>
                    ) : new Date(p.scheduledDate) <= new Date(now.getFullYear(), now.getMonth(), now.getDate()) ? (
                      <Button size="sm" className="rounded-lg" asChild>
                        <Link href={`/dashboard/${domainId}/content/write?planId=${p.id}&title=${encodeURIComponent(p.title)}&keyword=${encodeURIComponent(p.keyword || "")}`}>
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Write
                        </Link>
                      </Button>
                    ) : (
                      <div className="w-[76px]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        ) : null;
      })()}
    </div>
  );
}
