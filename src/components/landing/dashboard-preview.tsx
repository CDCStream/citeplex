"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Plus,
  Eye,
  MapPin,
  TrendingDown,
  TrendingUp,
  Check,
  X,
} from "lucide-react";
import Image from "next/image";

const ENGINE_LOGOS: Record<string, string> = {
  ChatGPT: "/engines/ChatGPT-Logo.png",
  Perplexity: "/engines/perplexity-logo.png",
  Gemini: "/engines/gemini-logo.png",
  Claude: "/engines/claude-logo.png",
  DeepSeek: "/engines/deepseek-logo.png",
  Grok: "/engines/grok-logo.png",
  Mistral: "/engines/mistral-logo.png",
};

const ENGINE_COLORS: Record<string, string> = {
  Gemini: "from-amber-500 to-yellow-400",
  Grok: "from-sky-500 to-sky-400",
  ChatGPT: "from-green-500 to-green-400",
  DeepSeek: "from-indigo-500 to-indigo-400",
  Perplexity: "from-blue-500 to-blue-400",
  Claude: "from-orange-500 to-orange-400",
  Mistral: "from-rose-500 to-rose-400",
};

const engineData = [
  { name: "Gemini", rate: 60, position: 2, color: "text-yellow-500" },
  { name: "Grok", rate: 90, position: 1, color: "text-green-500" },
  { name: "ChatGPT", rate: 80, position: 3, color: "text-green-500" },
  { name: "DeepSeek", rate: 0, position: null, color: "text-red-500" },
  { name: "Perplexity", rate: 10, position: 5, color: "text-red-500" },
  { name: "Claude", rate: 0, position: null, color: "text-red-500" },
  { name: "Mistral", rate: 20, position: 1, color: "text-red-500" },
];

const dailyTrend = [
  { date: "Mar 01", mentionRate: 20, avgPosition: 4.2 },
  { date: "Mar 02", mentionRate: 25, avgPosition: 3.8 },
  { date: "Mar 03", mentionRate: 22, avgPosition: 4.0 },
  { date: "Mar 04", mentionRate: 30, avgPosition: 3.5 },
  { date: "Mar 05", mentionRate: 28, avgPosition: 3.7 },
  { date: "Mar 06", mentionRate: 35, avgPosition: 3.2 },
  { date: "Mar 07", mentionRate: 32, avgPosition: 3.4 },
  { date: "Mar 08", mentionRate: 38, avgPosition: 3.0 },
  { date: "Mar 09", mentionRate: 40, avgPosition: 2.8 },
  { date: "Mar 10", mentionRate: 36, avgPosition: 3.1 },
  { date: "Mar 11", mentionRate: 42, avgPosition: 2.9 },
  { date: "Mar 12", mentionRate: 45, avgPosition: 2.7 },
  { date: "Mar 13", mentionRate: 37, avgPosition: 3.1 },
  { date: "Mar 14", mentionRate: 37, avgPosition: 3.1 },
];

const competitors = [
  { name: "Zety", rate: 90, position: 1, isOwn: false },
  { name: "Kickresume", rate: 63, position: 2.8, isOwn: false },
  { name: "Resume.io", rate: 37, position: 3.1, isOwn: true },
  { name: "ResumeGenius", rate: 33, position: 5.8, isOwn: false },
  { name: "LiveCareer", rate: 23, position: 5.8, isOwn: false },
  { name: "VisualCV", rate: 17, position: 6.8, isOwn: false },
];

const prompts = [
  {
    text: "What features should I look for in an online resume and cover letter maker?",
    mention: 43,
    position: 3.7,
    engines: { ChatGPT: { mentioned: true, pos: 3 }, Perplexity: { mentioned: true, pos: 2 }, Gemini: { mentioned: true, pos: 5 }, Claude: { mentioned: false, pos: null }, DeepSeek: { mentioned: false, pos: null }, Grok: { mentioned: true, pos: 4 }, Mistral: { mentioned: false, pos: null } },
  },
  {
    text: "Recommend online tools for creating a professional resume from scratch",
    mention: 57,
    position: 2.5,
    engines: { ChatGPT: { mentioned: true, pos: 2 }, Perplexity: { mentioned: true, pos: 1 }, Gemini: { mentioned: true, pos: 3 }, Claude: { mentioned: true, pos: 4 }, DeepSeek: { mentioned: false, pos: null }, Grok: { mentioned: true, pos: 2 }, Mistral: { mentioned: false, pos: null } },
  },
  {
    text: "What is the best resume builder for career changers?",
    mention: 29,
    position: 4.2,
    engines: { ChatGPT: { mentioned: false, pos: null }, Perplexity: { mentioned: true, pos: 3 }, Gemini: { mentioned: false, pos: null }, Claude: { mentioned: false, pos: null }, DeepSeek: { mentioned: false, pos: null }, Grok: { mentioned: true, pos: 5 }, Mistral: { mentioned: false, pos: null } },
  },
  {
    text: "How do I create an ATS-friendly resume that gets past filters?",
    mention: 14,
    position: 5.0,
    engines: { ChatGPT: { mentioned: false, pos: null }, Perplexity: { mentioned: false, pos: null }, Gemini: { mentioned: true, pos: 5 }, Claude: { mentioned: false, pos: null }, DeepSeek: { mentioned: false, pos: null }, Grok: { mentioned: false, pos: null }, Mistral: { mentioned: false, pos: null } },
  },
  {
    text: "Compare the best online resume builders for job seekers in 2026",
    mention: 43,
    position: 3.0,
    engines: { ChatGPT: { mentioned: true, pos: 1 }, Perplexity: { mentioned: true, pos: 3 }, Gemini: { mentioned: false, pos: null }, Claude: { mentioned: true, pos: 4 }, DeepSeek: { mentioned: false, pos: null }, Grok: { mentioned: false, pos: null }, Mistral: { mentioned: true, pos: 2 } },
  },
];

const ALL_ENGINES = ["ChatGPT", "Perplexity", "Gemini", "Claude", "DeepSeek", "Grok", "Mistral"];

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", active: false },
  { icon: LayoutDashboard, label: "Domains", active: false },
];

function getMentionColor(rate: number) {
  if (rate >= 80) return "text-green-500";
  if (rate >= 50) return "text-yellow-500";
  return "text-red-500";
}

function getPosBadgeClass(pos: number | null) {
  if (pos === null) return "bg-muted text-muted-foreground";
  if (pos <= 2) return "bg-green-500/15 text-green-600";
  if (pos <= 5) return "bg-yellow-500/15 text-yellow-600";
  return "bg-red-500/15 text-red-600";
}

function getMentionBadgeClass(rate: number) {
  if (rate >= 80) return "bg-green-500/15 text-green-600 border-green-500/30";
  if (rate >= 50) return "bg-yellow-500/15 text-yellow-600 border-yellow-500/30";
  return "bg-muted text-muted-foreground border-border";
}

export function DashboardPreview() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Browser Chrome */}
      <div className="rounded-t-2xl border border-b-0 bg-muted/50 px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="ml-4 flex-1 rounded-lg bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
          app.citeplex.io/dashboard
        </div>
      </div>

      {/* Dashboard */}
      <div className="flex overflow-hidden rounded-b-2xl border shadow-2xl shadow-primary/5">
        {/* Sidebar */}
        <div className="hidden w-44 shrink-0 border-r bg-muted/30 sm:block">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Image src="/logo.png" alt="Citeplex" width={20} height={20} className="rounded" unoptimized />
            <span className="text-sm font-bold">
              <span className="text-primary">Cite</span>plex
            </span>
          </div>
          <nav className="space-y-0.5 p-2">
            {sidebarItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </div>
            ))}
          </nav>
          <div className="mx-2 border-t pt-2">
            <p className="px-3 text-[10px] font-semibold uppercase text-muted-foreground">
              Your Domains
            </p>
            <div className="mt-1 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Resume.io
            </div>
            <div className="mt-0.5 space-y-0.5 pl-2">
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-primary">
                <LayoutDashboard className="h-3 w-3" />
                Dashboard
              </div>
              <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                Prompts
              </div>
              <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                <Users className="h-3 w-3" />
                Competitors
              </div>
            </div>
          </div>
          <div className="mx-2 mt-2 border-t pt-2">
            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
              <Plus className="h-3 w-3" />
              Add Domain
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-background p-3 sm:p-4 space-y-3 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-[10px]">R</div>
              <div>
                <h3 className="text-xs font-bold sm:text-sm">Resume.io</h3>
                <p className="text-[10px] text-muted-foreground">https://resume.io</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Last scan: <span className="font-medium text-foreground">20.03.2026</span>
            </p>
          </div>

          {/* Mention Rate + Average Position */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                    <Eye className="h-3 w-3" />
                    Mention Rate
                  </div>
                  <div className="text-2xl font-bold font-mono text-red-500 sm:text-3xl">
                    37<span className="text-lg">%</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    of AI responses mention your brand
                  </p>
                </div>
                <span className="flex items-center gap-0.5 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-600">
                  <TrendingDown className="h-3 w-3" />
                  Low
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-linear-to-r from-green-500 to-emerald-400" style={{ width: "37%" }} />
              </div>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                    <MapPin className="h-3 w-3" />
                    Average Position
                  </div>
                  <div className="text-2xl font-bold font-mono sm:text-3xl">
                    <span className="text-lg text-muted-foreground">#</span>3.1
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    average rank when mentioned
                  </p>
                </div>
                <span className="flex items-center gap-0.5 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  Top 5
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-2 pt-2 border-t">
                Last scan: 20.03.2026
              </p>
            </div>
          </div>

          {/* Engine Breakdown */}
          <div className="grid grid-cols-7 gap-1.5">
            {engineData.map((eng) => (
              <div key={eng.name} className="rounded-lg border bg-card p-2 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-1 mb-1">
                  <Image
                    src={ENGINE_LOGOS[eng.name]}
                    alt={eng.name}
                    width={eng.name === "ChatGPT" ? 24 : 12}
                    height={eng.name === "ChatGPT" ? 24 : 12}
                    className="rounded-sm object-contain"
                    unoptimized
                  />
                  <p className="text-[10px] font-semibold truncate">{eng.name}</p>
                </div>
                <div className="flex items-end justify-between">
                  <span className={`text-sm font-bold font-mono ${getMentionColor(eng.rate)}`}>
                    {eng.rate}%
                  </span>
                  <span className={`rounded px-1 py-0.5 text-[8px] font-bold ${getPosBadgeClass(eng.position)}`}>
                    {eng.position !== null ? `#${eng.position}` : "N/A"}
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-linear-to-r ${ENGINE_COLORS[eng.name]}`}
                    style={{ width: `${eng.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Daily Trend + Competitor Comparison */}
          <div className="grid gap-2 lg:grid-cols-2">
            {/* Daily Trend */}
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[11px] font-semibold mb-2">Daily Trend</p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={dailyTrend}>
                  <defs>
                    <linearGradient id="mentionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 10,
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                    }}
                    formatter={(value, name) => {
                      const v = typeof value === "number" ? value : Number(value ?? 0);
                      return [
                        name === "mentionRate" ? `${v}%` : `#${v}`,
                        name === "mentionRate" ? "Mention Rate" : "Avg Position",
                      ];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mentionRate"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#mentionGrad)"
                    name="mentionRate"
                  />
                  <Area
                    type="monotone"
                    dataKey="avgPosition"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    fill="url(#posGrad)"
                    strokeDasharray="4 4"
                    name="avgPosition"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-1 justify-center">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-[9px] text-muted-foreground">Mention Rate</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-[9px] text-muted-foreground">Avg Position</span>
                </div>
              </div>
            </div>

            {/* Competitor Comparison */}
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[11px] font-semibold mb-2">Competitor Comparison</p>
              <div className="space-y-2">
                {competitors.map((c) => {
                  const maxRate = 90;
                  return (
                    <div key={c.name} className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 w-20 shrink-0 ${c.isOwn ? "font-bold text-primary" : ""}`}>
                        <div className={`h-2 w-2 rounded-full shrink-0 ${c.isOwn ? "bg-primary" : "bg-muted-foreground/40"}`} />
                        <span className="text-[10px] truncate">{c.name}</span>
                      </div>
                      <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.isOwn ? "bg-primary" : "bg-muted-foreground/25"}`}
                          style={{ width: `${(c.rate / maxRate) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-28 justify-end">
                        <span className="text-[10px] font-semibold">{c.rate}% mentioned</span>
                        <span className="text-[9px] text-muted-foreground">Pos #{c.position}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Prompt Results */}
          <div className="rounded-xl border bg-card p-3">
            <p className="text-[11px] font-semibold mb-2">Prompt Results</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 px-1 font-medium text-muted-foreground min-w-[180px]">Prompt</th>
                    <th className="text-center py-1.5 px-1 font-medium text-muted-foreground w-14">Mention</th>
                    <th className="text-center py-1.5 px-1 font-medium text-muted-foreground w-14">Position</th>
                    {ALL_ENGINES.map((eng) => (
                      <th key={eng} className="text-center py-1.5 px-1 font-medium text-muted-foreground w-16">
                        <div className="flex flex-col items-center gap-0.5">
                          <Image
                            src={ENGINE_LOGOS[eng]}
                            alt={eng}
                            width={eng === "ChatGPT" ? 28 : 14}
                            height={eng === "ChatGPT" ? 28 : 14}
                            className="rounded-sm object-contain"
                            unoptimized
                          />
                          <span className="text-[9px]">{eng}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prompts.map((p, i) => (
                    <tr key={i} className="border-b border-dashed last:border-0 hover:bg-muted/30">
                      <td className="py-2 px-1 max-w-[200px]">
                        <div className="truncate font-medium">{p.text}</div>
                      </td>
                      <td className="text-center py-2 px-1">
                        <span className={`inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${getMentionBadgeClass(p.mention)}`}>
                          {p.mention}%
                        </span>
                      </td>
                      <td className="text-center py-2 px-1 font-semibold">
                        #{p.position}
                      </td>
                      {ALL_ENGINES.map((eng) => {
                        const result = p.engines[eng as keyof typeof p.engines];
                        return (
                          <td key={eng} className="text-center py-2 px-1">
                            <div className="flex flex-col items-center gap-0.5">
                              {result.mentioned ? (
                                <div className="mx-auto h-5 w-5 rounded-full bg-green-500/15 flex items-center justify-center">
                                  <Check className="h-3 w-3 text-green-500" />
                                </div>
                              ) : (
                                <div className="mx-auto h-5 w-5 rounded-full bg-red-500/10 flex items-center justify-center">
                                  <X className="h-3 w-3 text-red-400" />
                                </div>
                              )}
                              {result.pos !== null && (
                                <span className="text-[8px] text-muted-foreground">#{result.pos}</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
