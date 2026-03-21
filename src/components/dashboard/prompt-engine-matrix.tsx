"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";
import { countryFlag } from "@/lib/constants/countries";
import { EngineIcon } from "@/components/ui/engine-icon";
import { motion } from "framer-motion";

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  claude: "Claude",
  deepseek: "DeepSeek",
  grok: "Grok",
  mistral: "Mistral",
};

interface EngineResult {
  engine: string;
  mentioned: boolean;
  position: number | null;
  runs: number;
  mentionedRuns: number;
}

interface PromptResult {
  promptText: string;
  promptId: string;
  language?: string | null;
  country?: string | null;
  mentionRate: number;
  avgPosition: number | null;
  engines: EngineResult[];
}

function getMentionBadge(rate: number) {
  if (rate >= 80) return "bg-green-500/15 text-green-600 border-green-500/30";
  if (rate >= 50) return "bg-yellow-500/15 text-yellow-600 border-yellow-500/30";
  return "bg-secondary text-secondary-foreground";
}

export function PromptEngineMatrix({ rows }: { rows: PromptResult[] }) {
  if (rows.length === 0) return null;

  const ALL_ENGINES = ["chatgpt", "perplexity", "gemini", "claude", "deepseek", "grok", "mistral"];
  const dataEngines = new Set(rows.flatMap((r) => r.engines.map((e) => e.engine)));
  const allEngines = ALL_ENGINES.filter((e) => dataEngines.has(e)).concat(
    [...dataEngines].filter((e) => !ALL_ENGINES.includes(e))
  );
  if (allEngines.length < ALL_ENGINES.length) {
    for (const e of ALL_ENGINES) {
      if (!allEngines.includes(e)) allEngines.push(e);
    }
  }
  const hasCountry = rows.some((r) => r.country);
  const uniqueCountries = Array.from(new Set(rows.filter((r) => r.country).map((r) => r.country!)));
  const hasMultipleCountries = uniqueCountries.length > 1;

  const [filterCountry, setFilterCountry] = useState<string | null>(null);
  const filteredRows = filterCountry
    ? rows.filter((r) => r.country === filterCountry)
    : rows;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Prompt Results</CardTitle>
            {hasMultipleCountries && (
              <div className="flex gap-1">
                <Badge
                  variant={filterCountry === null ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setFilterCountry(null)}
                >
                  All
                </Badge>
                {uniqueCountries.map((code) => (
                  <Badge
                    key={code}
                    variant={filterCountry === code ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => setFilterCountry(filterCountry === code ? null : code)}
                  >
                    {countryFlag(code)} {code}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {hasCountry && (
                    <TableHead className="text-center w-[50px]"></TableHead>
                  )}
                  <TableHead className="min-w-[200px]">Prompt</TableHead>
                  <TableHead className="text-center w-[80px]">Mention</TableHead>
                  <TableHead className="text-center w-[80px]">Position</TableHead>
                  {allEngines.map((eng) => (
                    <TableHead key={eng} className="text-center w-[100px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <EngineIcon engine={eng} size={18} />
                        <span>{ENGINE_LABELS[eng] || eng}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row, i) => (
                  <motion.tr
                    key={row.promptId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.05 * i }}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    {hasCountry && (
                      <TableCell className="text-center">
                        <span className="text-base" title={row.country || ""}>
                          {row.country ? countryFlag(row.country) : ""}
                        </span>
                      </TableCell>
                    )}
                    <TableCell className="font-medium text-sm max-w-[300px]" title={row.promptText}>
                      <div className="truncate">{row.promptText}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-xs ${getMentionBadge(row.mentionRate)}`}>
                        {row.mentionRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium text-sm">
                      {row.avgPosition !== null ? `#${row.avgPosition}` : "—"}
                    </TableCell>
                    {allEngines.map((eng) => {
                      const result = row.engines.find((e) => e.engine === eng);
                      if (!result) {
                        return <TableCell key={eng} className="text-center text-muted-foreground text-xs">—</TableCell>;
                      }
                      return (
                        <TableCell key={eng} className="text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            {result.mentioned ? (
                              <div className="h-6 w-6 rounded-full bg-green-500/15 flex items-center justify-center">
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-red-500/10 flex items-center justify-center">
                                <X className="h-3.5 w-3.5 text-red-400" />
                              </div>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {result.position !== null ? `#${result.position}` : ""}
                            </span>
                          </div>
                        </TableCell>
                      );
                    })}
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
