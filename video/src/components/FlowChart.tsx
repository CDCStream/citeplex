import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface FlowChartProps {
  startFrame?: number;
  type?: "rising" | "falling" | "wave";
  color?: string;
  width?: number;
  height?: number;
}

export const FlowChart: React.FC<FlowChartProps> = ({
  startFrame = 0,
  type = "rising",
  color = "#a855f7",
  width = 600,
  height = 300,
}) => {
  const frame = useCurrentFrame();
  const relFrame = frame - startFrame;

  if (relFrame < 0) return null;

  const progress = interpolate(relFrame, [0, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(relFrame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const dataPoints = 20;
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= dataPoints; i++) {
    const normalizedX = i / dataPoints;
    if (normalizedX > progress) break;

    const x = normalizedX * width;
    let y: number;

    if (type === "rising") {
      y = height * 0.85 - normalizedX * height * 0.65 +
        Math.sin(normalizedX * Math.PI * 4) * height * 0.08;
    } else if (type === "falling") {
      y = height * 0.15 + normalizedX * height * 0.65 +
        Math.sin(normalizedX * Math.PI * 3) * height * 0.06;
    } else {
      y = height * 0.5 + Math.sin(normalizedX * Math.PI * 3 + frame * 0.05) * height * 0.3;
    }

    points.push({ x, y });
  }

  if (points.length < 2) return null;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg width={width} height={height} style={{ opacity }} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`chartGrad-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="chartGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={areaPath} fill={`url(#chartGrad-${type})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="3" filter="url(#chartGlow)" />
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="5"
          fill="#fff"
          filter="url(#chartGlow)"
        />
      )}
    </svg>
  );
};
