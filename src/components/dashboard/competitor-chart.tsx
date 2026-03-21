"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Favicon } from "@/components/ui/favicon";
import { motion, type Variants } from "framer-motion";

interface CompetitorData {
  name: string;
  url: string;
  mentionRate: number;
  avgPosition: number | null;
  isOwn: boolean;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0, 0, 0.58, 1] as const },
  },
};

export function CompetitorChart({ data }: { data: CompetitorData[] }) {
  if (data.length <= 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Competitor Comparison</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
          Add competitors to see how you compare.
        </CardContent>
      </Card>
    );
  }

  const sorted = [...data].sort((a, b) => b.mentionRate - a.mentionRate);
  const maxRate = Math.max(...sorted.map((d) => d.mentionRate), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Competitor Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {sorted.map((item, i) => (
              <motion.div
                key={item.name}
                variants={rowVariants}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Favicon url={item.url} size={20} />
                    <span className={`font-medium text-sm ${item.isOwn ? "text-primary" : ""}`}>
                      {item.name}
                    </span>
                    {item.isOwn && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{item.mentionRate}%</span> mentioned
                    </span>
                    <span className="text-muted-foreground">
                      Pos: <span className="font-semibold text-foreground">
                        {item.avgPosition !== null ? `#${item.avgPosition}` : "—"}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      item.isOwn
                        ? "bg-gradient-to-r from-primary to-primary/70"
                        : "bg-gradient-to-r from-muted-foreground/50 to-muted-foreground/30"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.mentionRate / maxRate) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 + i * 0.15 }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
