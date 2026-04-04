import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface AnimatedTextProps {
  text: string;
  startFrame?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  gradient?: string;
  style?: "fadeUp" | "typewriter" | "scaleIn" | "growIn" | "slideLeft" | "glowIn";
  align?: "center" | "left" | "right";
  maxWidth?: number;
  lineHeight?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  startFrame = 0,
  fontSize = 72,
  fontWeight = 800,
  color = "#ffffff",
  gradient,
  style = "fadeUp",
  align = "center",
  maxWidth = 1000,
  lineHeight = 1.1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relFrame = frame - startFrame;

  if (relFrame < 0) return null;

  let opacity = 1;
  let transform = "none";

  switch (style) {
    case "fadeUp": {
      opacity = interpolate(relFrame, [0, 20], [0, 1], {
        extrapolateRight: "clamp",
      });
      const y = interpolate(relFrame, [0, 20], [60, 0], {
        extrapolateRight: "clamp",
      });
      transform = `translateY(${y}px)`;
      break;
    }
    case "scaleIn": {
      const sc = spring({ frame: relFrame, fps, config: { damping: 12, mass: 0.5 } });
      opacity = sc;
      transform = `scale(${interpolate(sc, [0, 1], [0.5, 1])})`;
      break;
    }
    case "growIn": {
      const g = spring({ frame: relFrame, fps, config: { damping: 12, mass: 0.8 } });
      opacity = interpolate(g, [0, 1], [0, 1]);
      transform = `scale(${interpolate(g, [0, 1], [0.3, 1])})`;
      break;
    }
    case "slideLeft": {
      opacity = interpolate(relFrame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      });
      const x = interpolate(relFrame, [0, 20], [120, 0], {
        extrapolateRight: "clamp",
      });
      transform = `translateX(${x}px)`;
      break;
    }
    case "typewriter": {
      const chars = Math.floor(
        interpolate(relFrame, [0, text.length * 2], [0, text.length], {
          extrapolateRight: "clamp",
        })
      );
      return (
        <div
          style={{
            fontSize,
            fontWeight,
            color,
            textAlign: align,
            maxWidth,
            margin: "0 auto",
            lineHeight,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {text.slice(0, chars)}
          <span
            style={{
              opacity: relFrame % 16 > 8 ? 1 : 0,
              color: "#a855f7",
            }}
          >
            |
          </span>
        </div>
      );
    }
    case "glowIn": {
      opacity = interpolate(relFrame, [0, 25], [0, 1], {
        extrapolateRight: "clamp",
      });
      const glowSize = interpolate(relFrame, [0, 30], [40, 0], {
        extrapolateRight: "clamp",
      });
      return (
        <div
          style={{
            fontSize,
            fontWeight,
            textAlign: align,
            maxWidth,
            margin: "0 auto",
            lineHeight,
            fontFamily: "Inter, sans-serif",
            opacity,
            background: gradient || color,
            WebkitBackgroundClip: gradient ? "text" : undefined,
            WebkitTextFillColor: gradient ? "transparent" : undefined,
            filter: `blur(${glowSize}px)`,
          }}
        >
          {text}
        </div>
      );
    }
  }

  const textStyle: React.CSSProperties = {
    fontSize,
    fontWeight,
    textAlign: align,
    maxWidth,
    margin: "0 auto",
    lineHeight,
    fontFamily: "Inter, sans-serif",
    opacity,
    transform,
  };

  if (gradient) {
    textStyle.background = gradient;
    textStyle.WebkitBackgroundClip = "text";
    textStyle.WebkitTextFillColor = "transparent";
  } else {
    textStyle.color = color;
  }

  return <div style={textStyle}>{text}</div>;
};
