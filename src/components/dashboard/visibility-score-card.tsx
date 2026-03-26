"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Eye, MapPin, ThumbsUp } from "lucide-react";
import { EngineIcon } from "@/components/ui/engine-icon";
import { motion, type Variants } from "framer-motion";
import CountUp from "react-countup";

interface EngineBreakdown {
  engine: string;
  mentionRate: number;
  avgPosition: number | null;
}

interface SentimentBreakdown {
  positive: number;
  negative: number;
  neutral: number;
}

interface Props {
  mentionRate: number;
  avgPosition: number | null;
  sentimentBreakdown?: SentimentBreakdown;
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

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0, 0, 0.58, 1] as const },
  },
};

function getDominantLabel(s: SentimentBreakdown): { label: string; color: string } {
  if (s.positive >= 60) return { label: "Mostly Positive", color: "bg-green-500/15 text-green-600" };
  if (s.negative >= 60) return { label: "Mostly Negative", color: "bg-red-500/15 text-red-600" };
  return { label: "Mixed", color: "bg-amber-500/15 text-amber-600" };
}

export function VisibilityScoreCard({ mentionRate, avgPosition, sentimentBreakdown, lastScan, engineBreakdown }: Props) {
  const sentiment = sentimentBreakdown ?? { positive: 0, negative: 0, neutral: 0 };
  const hasSentiment = sentiment.positive + sentiment.negative + sentiment.neutral > 0;
  const dominant = getDominantLabel(sentiment);
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Hero Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
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
                  transition={{ duration: 1.5, ease: [0, 0, 0.58, 1], delay: 0.3 }}
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

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <ThumbsUp className="h-4 w-4" />
                  Sentiment
                </div>
                {hasSentiment && (
                  <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${dominant.color}`}>
                    {dominant.label}
                  </div>
                )}
              </div>
              {hasSentiment ? (
                <div className="space-y-3 mt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 font-semibold">{sentiment.positive}%</span>
                      <span className="text-xs text-muted-foreground">Positive</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${sentiment.positive}%` }}
                        transition={{ duration: 1.2, ease: [0, 0, 0.58, 1], delay: 0.3 }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-500 font-semibold">{sentiment.neutral}%</span>
                      <span className="text-xs text-muted-foreground">Neutral</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${sentiment.neutral}%` }}
                        transition={{ duration: 1.2, ease: [0, 0, 0.58, 1], delay: 0.5 }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-500 font-semibold">{sentiment.negative}%</span>
                      <span className="text-xs text-muted-foreground">Negative</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-red-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${sentiment.negative}%` }}
                        transition={{ duration: 1.2, ease: [0, 0, 0.58, 1], delay: 0.7 }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-bold text-muted-foreground mt-2">—</div>
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
                    transition={{ duration: 1.2, ease: [0, 0, 0.58, 1], delay: 0.5 + i * 0.1 }}
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
