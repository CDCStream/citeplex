import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface GlowLineProps {
  startFrame?: number;
  color?: string;
  direction?: "horizontal" | "rising" | "falling";
  width?: number;
  height?: number;
  top?: number;
  thickness?: number;
}

function getY(normalizedX: number, height: number, direction: string): number {
  if (direction === "rising") {
    return (
      height * 0.82 -
      normalizedX * height * 0.55 +
      Math.sin(normalizedX * Math.PI * 2.5) * height * 0.12 +
      Math.sin(normalizedX * Math.PI * 4.5 + 0.8) * height * 0.06
    );
  }
  if (direction === "falling") {
    return (
      height * 0.18 +
      normalizedX * height * 0.55 +
      Math.sin(normalizedX * Math.PI * 2) * height * 0.08
    );
  }
  return height * 0.5 + Math.sin(normalizedX * Math.PI * 4) * height * 0.15;
}

export const GlowLine: React.FC<GlowLineProps> = ({
  startFrame = 0,
  color = "#a855f7",
  direction = "rising",
  width = 1920,
  height = 600,
  top = 200,
  thickness = 6,
}) => {
  const frame = useCurrentFrame();
  const relFrame = frame - startFrame;

  if (relFrame < 0) return null;

  const progress = interpolate(relFrame, [0, 120], [0, 1], {
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(relFrame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const pathLength = progress * width;
  const segments = 120;

  const buildPath = () => {
    const pts: string[] = [];
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      if (x > pathLength) break;
      const y = getY(i / segments, height, direction);
      pts.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
    }
    return pts.join(" ");
  };

  const path = buildPath();
  const endNorm = pathLength / width;
  const dotY = getY(endNorm, height, direction);

  const uid = `gl-${direction}-${startFrame}`;

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        width,
        height,
        opacity,
        overflow: "hidden",
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {/* Wide outer glow */}
          <filter id={`${uid}-bigGlow`}>
            <feGaussianBlur stdDeviation="28" result="b1" />
            <feMerge>
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Medium glow */}
          <filter id={`${uid}-medGlow`}>
            <feGaussianBlur stdDeviation="10" result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Tight glow */}
          <filter id={`${uid}-tightGlow`}>
            <feGaussianBlur stdDeviation="3" />
          </filter>
          {/* Dot glow */}
          <filter id={`${uid}-dotGlow`}>
            <feGaussianBlur stdDeviation="6" result="db" />
            <feMerge>
              <feMergeNode in="db" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`${uid}-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="15%" stopColor={color} stopOpacity="0.6" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="85%" stopColor="#7c3aed" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Layer 1: Wide soft glow band */}
        <path
          d={path}
          fill="none"
          stroke={`${color}30`}
          strokeWidth={thickness * 12}
          filter={`url(#${uid}-bigGlow)`}
          strokeLinecap="round"
        />

        {/* Layer 2: Medium glow */}
        <path
          d={path}
          fill="none"
          stroke={`${color}60`}
          strokeWidth={thickness * 5}
          filter={`url(#${uid}-medGlow)`}
          strokeLinecap="round"
        />

        {/* Layer 3: Core bright line */}
        <path
          d={path}
          fill="none"
          stroke={`url(#${uid}-grad)`}
          strokeWidth={thickness}
          filter={`url(#${uid}-tightGlow)`}
          strokeLinecap="round"
        />

        {/* Layer 4: Thin white highlight */}
        <path
          d={path}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={thickness * 0.4}
          strokeLinecap="round"
        />

        {/* Animated dot at leading edge */}
        {pathLength > 20 && (
          <>
            <circle
              cx={Math.min(pathLength, width)}
              cy={dotY}
              r={12}
              fill={color}
              opacity={0.5}
              filter={`url(#${uid}-dotGlow)`}
            />
            <circle
              cx={Math.min(pathLength, width)}
              cy={dotY}
              r={6}
              fill="#fff"
              filter={`url(#${uid}-dotGlow)`}
            />
          </>
        )}
      </svg>
    </div>
  );
};
