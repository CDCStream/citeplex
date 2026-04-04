import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";

export const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, mass: 0.7 },
  });
  const textOpacity = interpolate(slideIn, [0, 1], [0, 1]);
  const textX = interpolate(slideIn, [0, 1], [-200, 0]);

  const orb1X = 350 + Math.sin(frame * 0.02) * 60;
  const orb1Y = 300 + Math.cos(frame * 0.015) * 50;
  const orb2X = 1300 + Math.sin(frame * 0.025 + 2) * 80;
  const orb2Y = 500 + Math.cos(frame * 0.018 + 1) * 60;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Floating orbs */}
      <div
        style={{
          position: "absolute",
          width: 450,
          height: 450,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
          left: orb1X,
          top: orb1Y,
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)",
          left: orb2X,
          top: orb2Y,
          filter: "blur(50px)",
        }}
      />

      {/* Center text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          opacity: textOpacity,
          transform: `translateX(${textX}px)`,
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            fontFamily: "Inter, sans-serif",
            color: "#ffffff",
            textAlign: "center",
            letterSpacing: -2,
            lineHeight: 1.15,
            maxWidth: 1100,
            textShadow: "0 0 80px rgba(168,85,247,0.25)",
          }}
        >
          For Boost{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #a855f7, #c084fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SEO
          </span>
          ,{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #6366f1, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AEO
          </span>{" "}
          and{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #38bdf8, #67e8f9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            GEO
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
