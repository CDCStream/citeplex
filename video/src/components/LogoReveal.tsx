import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface LogoRevealProps {
  startFrame?: number;
}

export const LogoReveal: React.FC<LogoRevealProps> = ({ startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relFrame = frame - startFrame;

  if (relFrame < 0) return null;

  const scaleVal = spring({ frame: relFrame, fps, config: { damping: 10, mass: 0.6 } });
  const opacity = interpolate(scaleVal, [0, 1], [0, 1]);
  const scale = interpolate(scaleVal, [0, 1], [0.3, 1]);

  const glowOpacity = interpolate(relFrame, [15, 35, 50], [0, 0.6, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* Glow ring behind logo */}
      <div
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, #a855f780 0%, transparent 70%)",
          opacity: glowOpacity,
          filter: "blur(30px)",
        }}
      />
      {/* Logo text */}
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          fontFamily: "Inter, sans-serif",
          letterSpacing: -3,
          position: "relative",
        }}
      >
        <span
          style={{
            background: "linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Cite
        </span>
        <span style={{ color: "#ffffff" }}>plex</span>
      </div>
    </div>
  );
};
