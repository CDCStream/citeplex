import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface CounterProps {
  from?: number;
  to: number;
  startFrame?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  fontSize?: number;
  color?: string;
  gradient?: string;
}

export const Counter: React.FC<CounterProps> = ({
  from = 0,
  to,
  startFrame = 0,
  duration = 45,
  suffix = "",
  prefix = "",
  fontSize = 120,
  color = "#fff",
  gradient,
}) => {
  const frame = useCurrentFrame();
  const relFrame = frame - startFrame;

  if (relFrame < 0) return null;

  const value = Math.floor(
    interpolate(relFrame, [0, duration], [from, to], {
      extrapolateRight: "clamp",
    })
  );

  const opacity = interpolate(relFrame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  const textStyle: React.CSSProperties = {
    fontSize,
    fontWeight: 900,
    fontFamily: "Inter, sans-serif",
    opacity,
    letterSpacing: -2,
  };

  if (gradient) {
    textStyle.background = gradient;
    textStyle.WebkitBackgroundClip = "text";
    textStyle.WebkitTextFillColor = "transparent";
  } else {
    textStyle.color = color;
  }

  return (
    <div style={textStyle}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </div>
  );
};
