"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Maximize2 } from "lucide-react";
import { EngineIcon } from "@/components/ui/engine-icon";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface TrendDataPoint {
  date: string;
  mentionRate: number;
  avgPosition: number | null;
}

interface TrendRawPoint {
  date: string;
  engine: string;
  promptId: string;
  promptText: string;
  brandMentioned: boolean;
  position: number | null;
}

interface CompetitorTrendRawPoint {
  date: string;
  engine: string;
  promptId: string;
  promptText: string;
  competitorId: string;
  competitorName: string;
  brandMentioned: boolean;
  position: number | null;
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

const ALL_ENGINES = ["chatgpt", "perplexity", "gemini", "claude", "deepseek", "grok", "mistral"];

const COMPETITOR_COLORS = [
  "#f97316", "#a855f7", "#ec4899", "#14b8a6", "#eab308",
  "#6366f1", "#ef4444", "#06b6d4", "#84cc16", "#f43f5e",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDateKey(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function aggregateRaw(
  raw: { date: string; brandMentioned: boolean; position: number | null }[],
) {
  const dayMap: Record<string, { total: number; mentioned: number; positions: number[] }> = {};
  for (const r of raw) {
    if (!dayMap[r.date]) dayMap[r.date] = { total: 0, mentioned: 0, positions: [] };
    dayMap[r.date].total++;
    if (r.brandMentioned) dayMap[r.date].mentioned++;
    if (r.position !== null) dayMap[r.date].positions.push(r.position);
  }
  return dayMap;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg max-w-xs">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {payload
        .filter((entry) => entry.value != null)
        .map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground truncate max-w-[140px]">{entry.name}:</span>
            <span className="font-semibold">
              {entry.dataKey === "avgPosition" || entry.dataKey.endsWith("_pos")
                ? `#${entry.value}`
                : `${entry.value}%`}
            </span>
          </div>
        ))}
    </div>
  );
}

function MultiSelectFilter({
  label,
  allItems,
  selectedItems,
  onToggle,
  onSelectAll,
  renderItem,
}: {
  label: string;
  allItems: { id: string; label: string }[];
  selectedItems: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  renderItem?: (item: { id: string; label: string }) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isAll = selectedItems.size === allItems.length;
  const displayText = isAll
    ? "All"
    : selectedItems.size === 0
      ? "None"
      : selectedItems.size <= 2
        ? allItems
            .filter((i) => selectedItems.has(i.id))
            .map((i) => i.label)
            .join(", ")
        : `${selectedItems.size} selected`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="text-muted-foreground">{label}:</span>
        <span className="max-w-[100px] truncate">{displayText}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-1 z-50 min-w-[200px] max-h-[280px] overflow-y-auto rounded-lg border bg-card shadow-lg p-1"
            >
              <button
                onClick={onSelectAll}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${
                    isAll ? "bg-primary border-primary" : "border-muted-foreground/30"
                  }`}
                >
                  {isAll && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                </div>
                <span className="font-medium">All</span>
              </button>
              <div className="h-px bg-border my-0.5" />
              {allItems.map((item) => {
                const checked = selectedItems.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => onToggle(item.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${
                        checked ? "bg-primary border-primary" : "border-muted-foreground/30"
                      }`}
                    >
                      {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                    {renderItem ? renderItem(item) : <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Shared chart rendering used by both inline and modal views
function TrendAreaChart({
  chartData,
  selectedCompList,
  height,
  gradientPrefix = "",
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartData: any[];
  selectedCompList: { id: string; name: string }[];
  height: number;
  gradientPrefix?: string;
}) {
  const mGrad = `${gradientPrefix}mentionGradient`;
  const pGrad = `${gradientPrefix}positionGradient`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={mGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id={pGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
          {selectedCompList.map((comp, i) => (
            <linearGradient key={comp.id} id={`${gradientPrefix}compGradient_${comp.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COMPETITOR_COLORS[i % COMPETITOR_COLORS.length]} stopOpacity={0.2} />
              <stop offset="100%" stopColor={COMPETITOR_COLORS[i % COMPETITOR_COLORS.length]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          reversed
          domain={[1, 10]}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `#${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="mentionRate"
          stroke="#22c55e"
          strokeWidth={2}
          fill={`url(#${mGrad})`}
          name="Your Mention Rate"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }}
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="avgPosition"
          stroke="#3b82f6"
          strokeWidth={2}
          fill={`url(#${pGrad})`}
          name="Your Avg Position"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }}
          connectNulls
        />
        {selectedCompList.map((comp, i) => {
          const color = COMPETITOR_COLORS[i % COMPETITOR_COLORS.length];
          return [
            <Area
              key={`${comp.id}_m`}
              yAxisId="left"
              type="monotone"
              dataKey={`${comp.id}_mention`}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="5 3"
              fill={`url(#${gradientPrefix}compGradient_${comp.id})`}
              name={`${comp.name} Mention`}
              dot={{ r: 4, fill: color, stroke: "hsl(var(--card))", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: color, stroke: "hsl(var(--card))", strokeWidth: 2 }}
              connectNulls
            />,
            <Area
              key={`${comp.id}_p`}
              yAxisId="right"
              type="monotone"
              dataKey={`${comp.id}_pos`}
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray="2 2"
              fill="none"
              name={`${comp.name} Position`}
              dot={{ r: 3, fill: "hsl(var(--card))", stroke: color, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: color, stroke: "hsl(var(--card))", strokeWidth: 2 }}
              connectNulls
            />,
          ];
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ChartLegend({ selectedCompList }: { selectedCompList: { id: string; name: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-[#22c55e]" />
        <span className="text-xs text-muted-foreground">Mention Rate</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-[#3b82f6]" />
        <span className="text-xs text-muted-foreground">Avg Position</span>
      </div>
      {selectedCompList.map((comp, i) => (
        <div key={comp.id} className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: COMPETITOR_COLORS[i % COMPETITOR_COLORS.length] }}
          />
          <span className="text-xs text-muted-foreground">{comp.name}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({
  data,
  trendRaw = [],
  competitorTrendRaw = [],
}: {
  data: TrendDataPoint[];
  trendRaw?: TrendRawPoint[];
  competitorTrendRaw?: CompetitorTrendRawPoint[];
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const availableEngines = useMemo(
    () => ALL_ENGINES.filter((e) => trendRaw.some((r) => r.engine === e)),
    [trendRaw],
  );

  const availablePrompts = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of trendRaw) {
      if (!seen.has(r.promptId)) seen.set(r.promptId, r.promptText);
    }
    return Array.from(seen.entries()).map(([id, text]) => ({ id, text }));
  }, [trendRaw]);

  const availableCompetitors = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of competitorTrendRaw) {
      if (!seen.has(r.competitorId)) seen.set(r.competitorId, r.competitorName);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [competitorTrendRaw]);

  const [selectedEngines, setSelectedEngines] = useState<Set<string>>(
    () => new Set(availableEngines),
  );
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(
    () => new Set(availablePrompts.map((p) => p.id)),
  );
  const [selectedCompetitors, setSelectedCompetitors] = useState<Set<string>>(
    () => new Set<string>(),
  );

  const hasFilters = trendRaw.length > 0;
  const isAllEngines = selectedEngines.size === availableEngines.length;
  const isAllPrompts = selectedPrompts.size === availablePrompts.length;
  const isAllCompetitors =
    availableCompetitors.length > 0 && selectedCompetitors.size === availableCompetitors.length;

  const chartData = useMemo(() => {
    let brandPoints: TrendDataPoint[];

    if (!hasFilters || (isAllEngines && isAllPrompts)) {
      brandPoints = data;
    } else {
      const filtered = trendRaw.filter(
        (r) => selectedEngines.has(r.engine) && selectedPrompts.has(r.promptId),
      );
      const dayMap = aggregateRaw(filtered);
      brandPoints = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30)
        .map(([date, d]) => ({
          date: formatDateKey(date),
          mentionRate: d.total > 0 ? Math.round((d.mentioned / d.total) * 100) : 0,
          avgPosition:
            d.positions.length > 0
              ? Math.round((d.positions.reduce((a, b) => a + b, 0) / d.positions.length) * 10) / 10
              : null,
        }));
    }

    if (selectedCompetitors.size === 0) {
      return brandPoints;
    }

    const compFiltered = competitorTrendRaw.filter(
      (r) =>
        selectedCompetitors.has(r.competitorId) &&
        selectedEngines.has(r.engine) &&
        selectedPrompts.has(r.promptId),
    );

    const compDayMaps: Record<string, Record<string, { total: number; mentioned: number; positions: number[] }>> = {};
    for (const r of compFiltered) {
      if (!compDayMaps[r.competitorId]) compDayMaps[r.competitorId] = {};
      const dm = compDayMaps[r.competitorId];
      if (!dm[r.date]) dm[r.date] = { total: 0, mentioned: 0, positions: [] };
      dm[r.date].total++;
      if (r.brandMentioned) dm[r.date].mentioned++;
      if (r.position !== null) dm[r.date].positions.push(r.position);
    }

    const allDates = new Set<string>();
    for (const bp of brandPoints) allDates.add(bp.date);
    const compRawDates = new Set<string>();
    for (const r of compFiltered) compRawDates.add(r.date);
    for (const d of compRawDates) allDates.add(formatDateKey(d));

    const brandMap = new Map(brandPoints.map((bp) => [bp.date, bp]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const combined: Record<string, any>[] = [];

    for (const dateLabel of Array.from(allDates).sort()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const point: Record<string, any> = {
        date: dateLabel,
        mentionRate: brandMap.get(dateLabel)?.mentionRate ?? null,
        avgPosition: brandMap.get(dateLabel)?.avgPosition ?? null,
      };

      for (const compId of selectedCompetitors) {
        const dm = compDayMaps[compId];
        if (!dm) continue;

        let matchedRawDate: string | undefined;
        for (const rd of Object.keys(dm)) {
          if (formatDateKey(rd) === dateLabel) {
            matchedRawDate = rd;
            break;
          }
        }

        if (matchedRawDate && dm[matchedRawDate]) {
          const cd = dm[matchedRawDate];
          point[`${compId}_mention`] = cd.total > 0 ? Math.round((cd.mentioned / cd.total) * 100) : 0;
          point[`${compId}_pos`] = cd.positions.length > 0
            ? Math.round((cd.positions.reduce((a, b) => a + b, 0) / cd.positions.length) * 10) / 10
            : null;
        }
      }

      combined.push(point);
    }

    return combined;
  }, [
    hasFilters, isAllEngines, isAllPrompts, data, trendRaw,
    selectedEngines, selectedPrompts, selectedCompetitors,
    competitorTrendRaw,
  ]);

  const toggleEngine = (id: string) => {
    setSelectedEngines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const togglePrompt = (id: string) => {
    setSelectedPrompts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCompetitor = (id: string) => {
    setSelectedCompetitors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (data.length === 0 && trendRaw.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Trend</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
          No trend data yet. Run a scan to start tracking.
        </CardContent>
      </Card>
    );
  }

  const engineFilterItems = availableEngines.map((e) => ({
    id: e,
    label: ENGINE_LABELS[e] ?? e,
  }));

  const promptFilterItems = availablePrompts.map((p) => ({
    id: p.id,
    label: p.text.length > 40 ? p.text.slice(0, 40) + "…" : p.text,
  }));

  const competitorFilterItems = availableCompetitors.map((c) => ({
    id: c.id,
    label: c.name,
  }));

  const selectedCompList = availableCompetitors.filter((c) => selectedCompetitors.has(c.id));

  const filtersBar = hasFilters ? (
    <div className="flex flex-wrap gap-2 pt-2">
      <MultiSelectFilter
        label="Engines"
        allItems={engineFilterItems}
        selectedItems={selectedEngines}
        onToggle={toggleEngine}
        onSelectAll={() =>
          setSelectedEngines(
            isAllEngines ? new Set([availableEngines[0]]) : new Set(availableEngines),
          )
        }
        renderItem={(item) => (
          <span className="flex items-center gap-1.5">
            <EngineIcon engine={item.id} className="h-3.5 w-3.5" />
            {item.label}
          </span>
        )}
      />
      <MultiSelectFilter
        label="Prompts"
        allItems={promptFilterItems}
        selectedItems={selectedPrompts}
        onToggle={togglePrompt}
        onSelectAll={() =>
          setSelectedPrompts(
            isAllPrompts
              ? new Set([availablePrompts[0]?.id].filter(Boolean))
              : new Set(availablePrompts.map((p) => p.id)),
          )
        }
      />
      {competitorFilterItems.length > 0 && (
        <MultiSelectFilter
          label="Competitors"
          allItems={competitorFilterItems}
          selectedItems={selectedCompetitors}
          onToggle={toggleCompetitor}
          onSelectAll={() =>
            setSelectedCompetitors(
              isAllCompetitors
                ? new Set()
                : new Set(availableCompetitors.map((c) => c.id)),
            )
          }
        />
      )}
    </div>
  ) : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">Daily Trend</CardTitle>
              <div className="flex items-center gap-3">
                <ChartLegend selectedCompList={selectedCompList} />
                <button
                  onClick={() => setModalOpen(true)}
                  className="rounded-lg border p-1.5 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                  title="Expand chart"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {filtersBar}
          </CardHeader>
          <CardContent>
            <TrendAreaChart
              chartData={chartData}
              selectedCompList={selectedCompList}
              height={340}
              gradientPrefix="inline_"
            />
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[95vw] max-h-[95vh] w-full">
          <DialogHeader>
            <div className="flex items-center justify-between flex-wrap gap-2 pr-8">
              <DialogTitle>Daily Trend</DialogTitle>
              <ChartLegend selectedCompList={selectedCompList} />
            </div>
            {filtersBar}
          </DialogHeader>
          <div className="w-full overflow-hidden">
            <TrendAreaChart
              chartData={chartData}
              selectedCompList={selectedCompList}
              height={550}
              gradientPrefix="modal_"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
