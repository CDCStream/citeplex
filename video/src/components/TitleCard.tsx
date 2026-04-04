import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Easing,
} from "remotion";
import { GradientBackground } from "./GradientBackground";
import type { TitleScene } from "../videos/types";

interface TitleCardProps {
  scene: TitleScene;
}

export const TitleCard: React.FC<TitleCardProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeOutStart = durationInFrames - 15;

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.6 },
    durationInFrames: 25,
  });

  const subtitleProgress = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 16, mass: 0.5 },
    durationInFrames: 20,
  });

  const logoProgress = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 12, mass: 0.4 },
    durationInFrames: 18,
  });

  const exitOpacity = interpolate(
    frame,
    [fadeOutStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);
  const subtitleY = interpolate(subtitleProgress, [0, 1], [30, 0]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <GradientBackground
        variant={scene.backgroundVariant ?? "default"}
        pulse
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          opacity: exitOpacity,
        }}
      >
        {scene.showLogo && (
          <img
            src={staticFile("logo.png")}
            alt=""
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              opacity: logoProgress,
              transform: `scale(${interpolate(logoProgress, [0, 1], [0.4, 1])})`,
              marginBottom: 8,
            }}
          />
        )}

        <div
          style={{
            fontSize: scene.titleFontSize ?? 80,
            fontWeight: 800,
            color: "#ffffff",
            fontFamily: "Inter, sans-serif",
            textAlign: "center",
            maxWidth: "85%",
            lineHeight: 1.15,
            opacity: titleSpring,
            transform: `translateY(${titleY}px)`,
            letterSpacing: "-1px",
          }}
        >
          {scene.title}
        </div>

        {scene.subtitle && (
          <div
            style={{
              fontSize: scene.subtitleFontSize ?? 32,
              fontWeight: 500,
              color: "rgba(255,255,255,0.6)",
              fontFamily: "Inter, sans-serif",
              textAlign: "center",
              maxWidth: "70%",
              lineHeight: 1.4,
              opacity: subtitleProgress,
              transform: `translateY(${subtitleY}px)`,
            }}
          >
            {scene.subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
