"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Eye, MapPin } from "lucide-react";
import { EngineIcon } from "@/components/ui/engine-icon";
import { motion } from "framer-motion";
import CountUp from "react-countup";

interface EngineBreakdown {
  engine: string;
  mentionRate: number;
  avgPosition: number | null;
}

interface Props {
  mentionRate: number;
  avgPosition: number | null;
  lastScan: string | null;
  engineBreakdown: EngineBreakdown[];
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

const ENGINE_GRADIENT: Record<string, string> = {
  chatgpt: "from-green-500 to-green-400",
  perplexity: "from-blue-500 to-blue-400",
  gemini: "from-amber-500 to-yellow-400",
  claude: "from-orange-500 to-orange-400",
  deepseek: "from-indigo-500 to-indigo-400",
  grok: "from-sky-500 to-sky-400",
  mistral: "from-rose-500 to-rose-400",
};

function getMentionColor(rate: number): string {
  if (rate >= 80) return "text-green-500";
  if (rate >= 50) return "text-yellow-500";
  return "text-red-500";
}

function getPositionBadge(pos: number | null) {
  if (pos === null) return <Badge variant="secondary" className="text-xs">N/A</Badge>;
  if (pos <= 2) return <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-xs">#{pos}</Badge>;
  if (pos <= 5) return <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 text-xs">#{pos}</Badge>;
  return <Badge className="bg-red-500/15 text-red-600 border-red-500/30 text-xs">#{pos}</Badge>;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function VisibilityScoreCard({ mentionRate, avgPosition, lastScan, engineBreakdown }: Props) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Hero Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Eye className="h-4 w-4" />
                    Mention Rate
                  </div>
                  <div className={`text-5xl font-bold tracking-tight font-mono ${getMentionColor(mentionRate)}`}>
                    <CountUp end={mentionRate} duration={2} />
                    <span className="text-3xl">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    of AI responses mention your brand
                  </p>
                </div>
                <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  mentionRate >= 50
                    ? "bg-green-500/15 text-green-600"
                    : "bg-red-500/15 text-red-600"
                }`}>
                  {mentionRate >= 50 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {mentionRate >= 50 ? "Good" : "Low"}
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${mentionRate}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    Average Position
                  </div>
                  <div className="text-5xl font-bold tracking-tight font-mono">
                    {avgPosition !== null ? (
                      <>
                        <span className="text-3xl text-muted-foreground">#</span>
                        <CountUp end={avgPosition} decimals={1} duration={2} />
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    average rank when mentioned
                  </p>
                </div>
                {avgPosition !== null && (
                  <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    avgPosition <= 3
                      ? "bg-green-500/15 text-green-600"
                      : avgPosition <= 5
                        ? "bg-yellow-500/15 text-yellow-600"
                        : "bg-red-500/15 text-red-600"
                  }`}>
                    {avgPosition <= 3 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {avgPosition <= 3 ? "Top 3" : avgPosition <= 5 ? "Top 5" : `#${avgPosition.toFixed(0)}`}
                  </div>
                )}
              </div>
              {lastScan && (
                <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                  Last scan: {lastScan}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Engine Breakdown */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {engineBreakdown.map((eng, i) => (
          <motion.div
            key={eng.engine}
            variants={itemVariants}
            custom={i}
          >
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <EngineIcon engine={eng.engine} size={24} />
                  <span className="font-semibold text-sm">{ENGINE_LABELS[eng.engine] || eng.engine}</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div className={`text-2xl font-bold font-mono ${getMentionColor(eng.mentionRate)}`}>
                    <CountUp end={eng.mentionRate} duration={2} delay={0.2 + i * 0.1} />%
                  </div>
                  {getPositionBadge(eng.avgPosition)}
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${ENGINE_GRADIENT[eng.engine] || "from-gray-500 to-gray-400"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${eng.mentionRate}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 + i * 0.1 }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
