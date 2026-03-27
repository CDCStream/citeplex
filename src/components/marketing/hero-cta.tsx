"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PulseBeams } from "@/components/ui/pulse-beams";

const beams = [
  {
    path: "M170 150H30C24.477 150 20 145.523 20 140V30",
    gradientConfig: {
      initial: { x1: "0%", x2: "0%", y1: "80%", y2: "100%" },
      animate: {
        x1: ["0%", "0%", "200%"],
        x2: ["0%", "0%", "180%"],
        y1: ["80%", "0%", "0%"],
        y2: ["100%", "20%", "20%"],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "linear",
        repeatDelay: 2,
        delay: 0.4,
      },
    },
    connectionPoints: [
      { cx: 20, cy: 24, r: 4 },
      { cx: 170, cy: 150, r: 4 },
    ],
  },
  {
    path: "M690 150H830C835.523 150 840 145.523 840 140V30",
    gradientConfig: {
      initial: { x1: "0%", x2: "0%", y1: "80%", y2: "100%" },
      animate: {
        x1: ["20%", "100%", "100%"],
        x2: ["0%", "90%", "90%"],
        y1: ["80%", "80%", "-20%"],
        y2: ["100%", "100%", "0%"],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "linear",
        repeatDelay: 2,
        delay: 1.2,
      },
    },
    connectionPoints: [
      { cx: 840, cy: 24, r: 4 },
      { cx: 690, cy: 150, r: 4 },
    ],
  },
  {
    path: "M350 150V30C350 24.477 354.477 20 360 20H420",
    gradientConfig: {
      initial: { x1: "-40%", x2: "-10%", y1: "0%", y2: "20%" },
      animate: {
        x1: ["40%", "0%", "0%"],
        x2: ["10%", "0%", "0%"],
        y1: ["0%", "0%", "180%"],
        y2: ["20%", "20%", "200%"],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "linear",
        repeatDelay: 2,
        delay: 0.8,
      },
    },
    connectionPoints: [
      { cx: 426, cy: 20, r: 4 },
      { cx: 350, cy: 150, r: 4 },
    ],
  },
  {
    path: "M510 150V30C510 24.477 505.523 20 500 20H440",
    gradientConfig: {
      initial: { x1: "40%", x2: "50%", y1: "160%", y2: "180%" },
      animate: { x1: "0%", x2: "10%", y1: "-40%", y2: "-20%" },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "linear",
        repeatDelay: 2,
        delay: 1.6,
      },
    },
    connectionPoints: [
      { cx: 434, cy: 20, r: 4 },
      { cx: 510, cy: 150, r: 4 },
    ],
  },
  {
    path: "M250 150H80C74.477 150 70 154.477 70 160V270",
    gradientConfig: {
      initial: { x1: "0%", x2: "0%", y1: "80%", y2: "100%" },
      animate: {
        x1: ["20%", "100%", "100%"],
        x2: ["0%", "90%", "90%"],
        y1: ["80%", "80%", "-20%"],
        y2: ["100%", "100%", "0%"],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "linear",
        repeatDelay: 2,
        delay: 2.0,
      },
    },
    connectionPoints: [
      { cx: 70, cy: 276, r: 4 },
      { cx: 250, cy: 150, r: 4 },
    ],
  },
  {
    path: "M610 150H780C785.523 150 790 154.477 790 160V270",
    gradientConfig: {
      initial: { x1: "40%", x2: "50%", y1: "160%", y2: "180%" },
      animate: { x1: "0%", x2: "10%", y1: "-40%", y2: "-20%" },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "linear",
        repeatDelay: 2,
        delay: 0.2,
      },
    },
    connectionPoints: [
      { cx: 790, cy: 276, r: 4 },
      { cx: 610, cy: 150, r: 4 },
    ],
  },
];

const gradientColors = {
  start: "#3b82f6",
  middle: "#2563eb",
  end: "#60a5fa",
};

export function HeroCta() {
  return (
    <PulseBeams
      beams={beams}
      gradientColors={gradientColors}
      width={860}
      height={300}
      baseColor="#e2e8f0"
      accentColor="#cbd5e1"
      className="mt-10 py-12"
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Button
          size="lg"
          variant="outline"
          className="h-13 rounded-full border-2 px-8 text-base font-semibold"
          asChild
        >
          <Link href="/login">
            <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Join with Google
          </Link>
        </Button>
        <Button
          size="lg"
          className="h-13 rounded-full bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-shadow"
          asChild
        >
          <Link href="/login">
            Get Started for Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </PulseBeams>
  );
}
