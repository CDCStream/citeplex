import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { GlowLine } from "../components/GlowLine";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, mass: 0.7 },
  });
  const textOpacity = interpolate(slideIn, [0, 1], [0, 1]);
  const textX = interpolate(slideIn, [0, 1], [-200, 0]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(120,40,200,0.08) 0%, transparent 70%)",
        }}
      />

      <GlowLine
        startFrame={0}
        color="#a855f7"
        direction="rising"
        width={1920}
        height={750}
        top={80}
        thickness={7}
      />

      <div
        style={{
          position: "absolute",
          bottom: 140,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: textOpacity,
          transform: `translateX(${textX}px)`,
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 82,
            fontWeight: 800,
            fontFamily: "Inter, sans-serif",
            color: "#ffffff",
            letterSpacing: -2,
            lineHeight: 1.1,
            textShadow: "0 0 60px rgba(168,85,247,0.3), 0 0 120px rgba(168,85,247,0.15)",
          }}
        >
          You want more organic traffic
        </div>
      </div>
    </AbsoluteFill>
  );
};
