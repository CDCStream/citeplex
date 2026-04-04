import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const E_FILL = "eeeeeeeeeeeeeeeeeeee";

export const Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slide-in
  const slideIn = spring({
    frame: frame - 3,
    fps,
    config: { damping: 14, mass: 0.7 },
  });
  const entryOpacity = interpolate(slideIn, [0, 1], [0, 1]);
  const entryX = interpolate(slideIn, [0, 1], [-300, 0]);

  // Stretch width: 0 → max → 0 (no pause at peak)
  const expandWidth = interpolate(frame, [10, 35], [0, 700], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shrinkWidth = interpolate(frame, [35, 60], [700, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const middleWidth = frame < 35 ? expandWidth : shrinkWidth;


  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Clean black background, no orbs */}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          opacity: entryOpacity,
          transform: `translateX(${entryX}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 100,
            fontWeight: 900,
            fontFamily: "Inter, sans-serif",
            color: "#ffffff",
            letterSpacing: -3,
            lineHeight: 1,
            textShadow: "none",
          }}
        >
          <span>Me</span>

          {/* Stretchable section — extra "e"s + "et!" inside, right-aligned */}
          <div
            style={{
              display: "inline-flex",
              overflow: "hidden",
              width: middleWidth + 125,
              whiteSpace: "nowrap",
              position: "relative",
              direction: "rtl",
            }}
          >
            <span
              style={{
                direction: "ltr",
                display: "inline-block",
                fontSize: 100,
                fontWeight: 900,
                fontFamily: "Inter, sans-serif",
                letterSpacing: -3,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.7)" }}>{E_FILL}</span>
              <span style={{ color: "#ffffff" }}>et!</span>
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
