"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BeamPath {
  path: string;
  gradientConfig: {
    initial: {
      x1: string;
      x2: string;
      y1: string;
      y2: string;
    };
    animate: {
      x1: string | string[];
      x2: string | string[];
      y1: string | string[];
      y2: string | string[];
    };
    transition?: {
      duration?: number;
      repeat?: number;
      repeatType?: string;
      ease?: string;
      repeatDelay?: number;
      delay?: number;
    };
  };
  connectionPoints?: Array<{
    cx: number;
    cy: number;
    r: number;
  }>;
}

interface PulseBeamsProps {
  children?: React.ReactNode;
  className?: string;
  beams: BeamPath[];
  width?: number;
  height?: number;
  baseColor?: string;
  accentColor?: string;
  gradientColors?: {
    start: string;
    middle: string;
    end: string;
  };
}

export const PulseBeams = ({
  children,
  className,
  beams,
  width = 858,
  height = 300,
  baseColor = "#cbd5e1",
  accentColor = "#94a3b8",
  gradientColors,
}: PulseBeamsProps) => {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center antialiased overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <SVGs
          beams={beams}
          width={width}
          height={height}
          baseColor={baseColor}
          accentColor={accentColor}
          gradientColors={gradientColors}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const SVGs = ({
  beams,
  width,
  height,
  baseColor,
  accentColor,
  gradientColors,
}: {
  beams: BeamPath[];
  width: number;
  height: number;
  baseColor: string;
  accentColor: string;
  gradientColors?: { start: string; middle: string; end: string };
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex shrink-0"
    >
      {beams.map((beam, index) => (
        <React.Fragment key={index}>
          <path d={beam.path} stroke={baseColor} strokeWidth="1" />
          <path
            d={beam.path}
            stroke={`url(#pulse-grad${index})`}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {beam.connectionPoints?.map((point, pointIndex) => (
            <circle
              key={`${index}-${pointIndex}`}
              cx={point.cx}
              cy={point.cy}
              r={point.r}
              fill={baseColor}
              stroke={accentColor}
            />
          ))}
        </React.Fragment>
      ))}

      <defs>
        {beams.map((beam, index) => (
          <motion.linearGradient
            key={index}
            id={`pulse-grad${index}`}
            gradientUnits="userSpaceOnUse"
            initial={beam.gradientConfig.initial}
            animate={beam.gradientConfig.animate}
            transition={beam.gradientConfig.transition as any}
          >
            <GradientColors colors={gradientColors} />
          </motion.linearGradient>
        ))}
      </defs>
    </svg>
  );
};

const GradientColors = ({
  colors = {
    start: "#3b82f6",
    middle: "#2563eb",
    end: "#60a5fa",
  },
}: {
  colors?: { start: string; middle: string; end: string };
}) => {
  return (
    <>
      <stop offset="0%" stopColor={colors.start} stopOpacity="0" />
      <stop offset="20%" stopColor={colors.start} stopOpacity="1" />
      <stop offset="50%" stopColor={colors.middle} stopOpacity="1" />
      <stop offset="100%" stopColor={colors.end} stopOpacity="0" />
    </>
  );
};
