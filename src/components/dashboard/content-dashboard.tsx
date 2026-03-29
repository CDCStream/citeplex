"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Pencil,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  writing: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  review: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  published: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
};

const ARTICLE_TYPES = [
  { value: "guide", label: "Guide" },
  { value: "how-to", label: "How-To" },
  { value: "listicle", label: "Listicle" },
  { value: "comparison", label: "Comparison" },
  { value: "explainer", label: "Explainer" },
  { value: "round-up", label: "Round-Up" },
];

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
  articleLimit,
}: {
  domainId: string;
  brandName: string;
  description: string;
  industry: string;
  plans: ContentPlanItem[];
  articlesUsed: number;
  articleLimit: number;
}) {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState("");
  const [articleType, setArticleType] = useState("guide");
  const [selectedDate, setSelectedDate] = useState(
    now.toISOString().split("T")[0]
  );

  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { title: string; keyword: string; type: string }[]
  >([]);

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

  async function handleAdd() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/content/${domainId}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          keyword: keyword.trim() || null,
          articleType,
          scheduledDate: selectedDate,
        }),
      });
      setAddOpen(false);
      setTitle("");
      setKeyword("");
      router.refresh();
    } catch {
      // keep dialog open
    } finally {
      setSaving(false);
    }
  }

  async function handleSuggest() {
    setSuggesting(true);
    setSuggestions([]);
    try {
      const res = await fetch(`/api/content/${domainId}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, description, industry }),
      });
      const data = await res.json();
      if (data.suggestions) setSuggestions(data.suggestions);
    } catch {
      // ignore
    } finally {
      setSuggesting(false);
    }
  }

  function useSuggestion(s: { title: string; keyword: string; type: string }) {
    setTitle(s.title);
    setKeyword(s.keyword);
    setArticleType(s.type);
    setSuggestions([]);
  }

  const remaining = Math.max(0, articleLimit - articlesUsed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Content</h1>
            <p className="text-sm text-muted-foreground">
              Plan, write, and publish AI-optimized articles for {brandName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{articlesUsed}</span> / {articleLimit} articles
          </span>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button disabled={remaining <= 0}>
                <Plus className="mr-2 h-4 w-4" />
                Plan Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Plan a new article</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. How to Improve Your SEO in 2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Keyword</Label>
                  <Input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. SEO tips 2026"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      value={articleType}
                      onChange={(e) => setArticleType(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {ARTICLE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                </div>

                {suggestions.length === 0 && (
                  <Button
                    variant="outline"
                    onClick={handleSuggest}
                    disabled={suggesting}
                    className="w-full"
                  >
                    {suggesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating ideas...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Topic Suggestions
                      </>
                    )}
                  </Button>
                )}

                {suggestions.length > 0 && (
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Suggestions
                    </p>
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => useSuggestion(s)}
                        className="flex items-center gap-2 w-full rounded-lg border p-2.5 text-sm text-left hover:bg-muted/50 transition-colors"
                      >
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {s.type}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{s.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {s.keyword}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleAdd}
                  disabled={!title.trim() || saving}
                  className="w-full"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Calendar className="mr-2 h-4 w-4" />
                  )}
                  Add to Calendar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {MONTHS[month]} {year}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground"
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
              return (
                <div
                  key={i}
                  className={`bg-background min-h-[80px] p-1.5 ${
                    day ? "" : "bg-muted/30"
                  }`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-xs font-medium mb-1 ${
                          isToday
                            ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
                            : "text-muted-foreground"
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayPlans.slice(0, 3).map((p) => {
                          const vol = p.keywordData?.volume;
                          const kd = p.keywordData?.difficulty;
                          return (
                            <div
                              key={p.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[p.status] || "bg-muted"}`}
                            >
                              <div className="truncate">{p.title}</div>
                              {(vol != null || kd != null) && (
                                <div className="flex gap-2 mt-0.5 text-[9px] opacity-75 font-medium">
                                  {vol != null && <span>Vol: {vol.toLocaleString()}</span>}
                                  {kd != null && <span>KD: {kd}</span>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {dayPlans.length > 3 && (
                          <div className="text-[10px] text-muted-foreground px-1.5">
                            +{dayPlans.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming articles list */}
      {plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Planned Articles ({plans.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plans.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.title}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {p.keyword && (
                      <span className="text-xs text-muted-foreground">
                        {p.keyword}
                      </span>
                    )}
                    {p.articleType && (
                      <Badge variant="outline" className="text-[10px]">
                        {p.articleType}
                      </Badge>
                    )}
                    {p.keywordData?.volume != null && (
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Vol: {p.keywordData.volume.toLocaleString()}
                      </span>
                    )}
                    {p.keywordData?.difficulty != null && (
                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                        KD: {p.keywordData.difficulty}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.scheduledDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 ${STATUS_COLORS[p.status] || ""}`}
                >
                  {p.status}
                </Badge>
                {p.articleId ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/${domainId}/content/article/${p.articleId}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/${domainId}/content/write?planId=${p.id}&title=${encodeURIComponent(p.title)}&keyword=${encodeURIComponent(p.keyword || "")}`}>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
