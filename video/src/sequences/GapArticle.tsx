import React from "react";
import { AbsoluteFill, Video, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const TEXT_DURATION = 75;
const SCREEN_START = 80;

export const GapArticle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textEnter = spring({ frame: frame - 5, fps, config: { damping: 14, mass: 0.7 } });
  const textOpacity = interpolate(textEnter, [0, 1], [0, 1]);
  const textY = interpolate(textEnter, [0, 1], [80, 0]);

  const textFadeOut = interpolate(frame, [TEXT_DURATION - 12, TEXT_DURATION], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const screenVisible = frame >= SCREEN_START;
  const screenEnter = spring({ frame: frame - SCREEN_START - 5, fps, config: { damping: 14, mass: 0.8 } });
  const screenOpacity = interpolate(screenEnter, [0, 1], [0, 1]);
  const screenRotateY = interpolate(screenEnter, [0, 1], [10, 2]);
  const screenRotateX = interpolate(screenEnter, [0, 1], [5, 1]);
  const screenScale = interpolate(screenEnter, [0, 1], [0.9, 1.35]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Phase 1: Animated text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          opacity: Math.min(textOpacity, textFadeOut),
          transform: `translateY(${textY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            fontFamily: "Inter, sans-serif",
            color: "#ffffff",
            letterSpacing: -2,
            textAlign: "center",
            maxWidth: 1100,
            lineHeight: 1.15,
          }}
        >
          Write a Gap Article for AI{" "}
          <span style={{ color: "#a855f7" }}>to Mention</span>{" "}
          in the Prompt.
        </div>
      </div>

      {/* Phase 2: 3D browser frame with gap article recording */}
      {screenVisible && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            perspective: 1200,
            opacity: screenOpacity,
          }}
        >
          <div
            style={{
              transform: `rotateY(${screenRotateY}deg) rotateX(${screenRotateX}deg) scale(${screenScale})`,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 0 80px rgba(168,85,247,0.25), 0 20px 60px rgba(0,0,0,0.5)",
              border: "1px solid rgba(168,85,247,0.2)",
              width: 1300,
            }}
          >
            {/* Browser chrome */}
            <div
              style={{
                background: "linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
              </div>
              <div
                style={{
                  flex: 1,
                  marginLeft: 12,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 6,
                  padding: "5px 14px",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                citeplex.io/dashboard/content/write
              </div>
            </div>

            {/* Gap article screen recording */}
            <Video
              src={staticFile("gap-article.mp4")}
              style={{
                width: 1300,
                display: "block",
              }}
              muted
            />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
