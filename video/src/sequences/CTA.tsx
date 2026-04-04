import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Logo drops in with spring (frame 0-30)
  const logoSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 10, mass: 0.6 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.2, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);
  const logoRotate = interpolate(logoSpring, [0, 1], [-15, 0]);

  // Phase 2: Text slides in after logo (frame 25+)
  const textSlide = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, mass: 0.7 },
  });
  const textOpacity = interpolate(textSlide, [0, 1], [0, 1]);
  const textX = interpolate(textSlide, [0, 1], [-200, 0]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          zIndex: 2,
        }}
      >
        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{
              width: 120,
              height: 120,
              objectFit: "contain",
            }}
          />
        </div>

        {/* Citeplex text */}
        <div
          style={{
            opacity: textOpacity,
            transform: `translateX(${textX}px)`,
            fontSize: 90,
            fontWeight: 900,
            fontFamily: "Inter, sans-serif",
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#ffffff" }}>Cite</span>
          <span style={{ color: "#38bdf8" }}>plex</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
