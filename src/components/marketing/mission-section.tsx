"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { TrendingUp, ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";

function CountUp({
  target,
  duration = 2000,
  start = false,
}: {
  target: number;
  duration?: number;
  start: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let frame: number;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [start, target, duration]);

  return <>{value}</>;
}

export function MissionSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="border-t bg-muted/30">
      <div ref={ref} className="mx-auto max-w-6xl px-4 py-12 sm:py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Our Mission
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            From invisible to{" "}
            <span className="bg-linear-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              authoritative
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Real results. Real growth. This is what Citeplex does for your domain.
          </p>
        </div>

        <div className="grid items-center gap-6 sm:gap-8 md:grid-cols-[1fr_auto_1fr]">
          {/* Before — DR 6 */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative"
          >
            <div className="mb-4 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                Before Citeplex
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border-2 border-red-200/50 bg-card shadow-lg opacity-75 dark:border-red-900/50">
              <Image
                src="/ahrefs-low.png"
                alt="Domain Rating 6 — before Citeplex"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
            <div className="mt-4 text-center">
              <span className="text-sm text-muted-foreground">Domain Rating</span>
              <p className="text-4xl sm:text-5xl font-black text-red-500 tabular-nums">
                <CountUp target={6} duration={1200} start={isInView} />
              </p>
            </div>
          </motion.div>

          {/* Center — Arrow Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center gap-3 py-4"
          >
            <motion.div
              animate={isInView ? { y: [0, -8, 0] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <TrendingUp className="h-10 w-10 text-emerald-500" />
            </motion.div>
            <div className="hidden md:block h-24 w-px bg-linear-to-b from-red-300 via-amber-300 to-emerald-400" />
            <div className="md:hidden w-24 h-px bg-linear-to-r from-red-300 via-amber-300 to-emerald-400" />
            <ArrowRight className="h-6 w-6 text-emerald-500 md:hidden" />
            <motion.div
              animate={isInView ? { y: [0, -6, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="hidden md:flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
            >
              <TrendingUp className="h-5 w-5" />
            </motion.div>
          </motion.div>

          {/* After — DR 43 */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            className="relative"
          >
            <div className="mb-4 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
                After Citeplex
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border-2 border-emerald-200/50 bg-card shadow-lg shadow-emerald-500/10 dark:border-emerald-900/50">
              <Image
                src="/ahrefs-high.png"
                alt="Domain Rating 43 — after Citeplex"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
            <div className="mt-4 text-center">
              <span className="text-sm text-muted-foreground">Domain Rating</span>
              <p className="text-4xl sm:text-5xl font-black text-emerald-500 tabular-nums">
                <CountUp target={43} duration={2000} start={isInView} />
              </p>
            </div>
          </motion.div>
        </div>

        {/* Stat highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-10 sm:mt-16 grid grid-cols-3 gap-4 sm:gap-6 mx-auto max-w-2xl"
        >
          {[
            { value: "7x", label: "DR Increase", color: "text-emerald-500" },
            { value: "24/7", label: "Automated Tracking", color: "text-blue-500" },
            { value: "100%", label: "AI-Powered", color: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className={`text-2xl font-extrabold ${stat.color} sm:text-4xl`}>
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
