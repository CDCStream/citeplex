"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EngineIcon } from "@/components/ui/engine-icon";

const SCAN_ENGINES = ["chatgpt", "perplexity", "gemini", "claude", "deepseek", "grok", "mistral"];

interface Props {
  domainId: string;
  initialStatus: string;
  isFirstScan?: boolean;
}

export function ScanStatusBanner({ domainId, initialStatus, isFirstScan = false }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [showCompleted, setShowCompleted] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const router = useRouter();

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/scan-status/${domainId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.progress) setProgress(data.progress);
      return data.status as string;
    } catch {
      return status;
    }
  }, [domainId, status]);

  useEffect(() => {
    if (status !== "scanning") return;

    const interval = setInterval(async () => {
      const newStatus = await poll();
      if (newStatus !== status) {
        setStatus(newStatus);
        if (newStatus === "completed") {
          setShowCompleted(true);
          setTimeout(() => router.refresh(), 1500);
          setTimeout(() => setShowCompleted(false), 5000);
        }
      }
    }, 3000);

    poll();
    return () => clearInterval(interval);
  }, [status, poll, router, isFirstScan]);

  useEffect(() => {
    if (initialStatus === "scanning" && status !== "scanning") return;
    if (initialStatus !== status) {
      setStatus(initialStatus);
      if (initialStatus === "completed") {
        setShowCompleted(true);
        setTimeout(() => setShowCompleted(false), 5000);
      }
    }
  }, [initialStatus]);

  const pct = progress && progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  if (isFirstScan && status === "scanning") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <Radio className="h-5 w-5 text-blue-500" />
            <span className="absolute h-5 w-5 rounded-full bg-blue-500/20 animate-ping" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              First scan in progress...
            </p>
            <p className="text-xs text-muted-foreground">
              Querying 7 AI engines to measure your brand visibility.
            </p>
          </div>
          <Loader2 className="h-4 w-4 animate-spin text-blue-500 shrink-0 ml-auto" />
        </div>

        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded-full bg-blue-100 dark:bg-blue-900/30 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-blue-500"
              initial={{ width: "2%" }}
              animate={{ width: `${Math.max(2, pct)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{progress ? `${progress.completed} / ${progress.total} queries` : "Starting..."}</span>
            <span>{pct}%</span>
          </div>
        </div>

        <div className="flex justify-center gap-3 flex-wrap">
          {SCAN_ENGINES.map((engine) => (
            <div key={engine} className="flex flex-col items-center gap-1">
              <div className="rounded-full p-1.5 bg-white/60 dark:bg-white/10 ring-1 ring-blue-200/50 animate-pulse">
                <EngineIcon engine={engine} size={18} />
              </div>
              <span className="text-[9px] text-muted-foreground capitalize">{engine}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {status === "scanning" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 space-y-2.5"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <Radio className="h-4 w-4 text-blue-500" />
              <span className="absolute h-4 w-4 rounded-full bg-blue-500/20 animate-ping" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Scanning in progress for today
              </p>
              <p className="text-xs text-muted-foreground">
                Previous results are shown below. New data will replace them when the scan is complete.
              </p>
            </div>
            <Loader2 className="h-4 w-4 animate-spin text-blue-500 shrink-0" />
          </div>

          {progress && progress.total > 0 && (
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-blue-100 dark:bg-blue-900/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-blue-500"
                  initial={{ width: "2%" }}
                  animate={{ width: `${Math.max(2, pct)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground text-right">{pct}%</p>
            </div>
          )}
        </motion.div>
      )}

      {showCompleted && status === "completed" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 flex items-center gap-3"
        >
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Scan completed
            </p>
            <p className="text-xs text-muted-foreground">
              All results have been updated.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
