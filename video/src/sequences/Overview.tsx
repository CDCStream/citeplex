import React from "react";
import { AbsoluteFill, Video, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const SCREEN_START = 40;

export const Overview: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Text
  const textSlide = spring({ frame: frame - 5, fps, config: { damping: 14, mass: 0.7 } });
  const textOpacity = interpolate(textSlide, [0, 1], [0, 1]);
  const textX = interpolate(textSlide, [0, 1], [-200, 0]);
  const textFadeOut = interpolate(frame, [28, 38], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 2: Screen recording in 3D browser frame
  const screenVisible = frame >= SCREEN_START;
  const screenEnter = spring({ frame: frame - SCREEN_START - 5, fps, config: { damping: 14, mass: 0.8 } });
  const screenOpacity = interpolate(screenEnter, [0, 1], [0, 1]);
  const screenRotateY = interpolate(screenEnter, [0, 1], [10, 2]);
  const screenRotateX = interpolate(screenEnter, [0, 1], [5, 1]);
  const screenScale = interpolate(screenEnter, [0, 1], [0.9, 1.35]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Phase 1: Text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          opacity: Math.min(textOpacity, textFadeOut),
          transform: `translateX(${textX}px)`,
        }}
      >
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            fontFamily: "Inter, sans-serif",
            color: "#ffffff",
            letterSpacing: -2,
          }}
        >
          Track your AI Visibility
        </div>
      </div>

      {/* Phase 2: 3D Browser frame with screen recording */}
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
                citeplex.io/dashboard/ai-visibility
              </div>
            </div>

            {/* Screen recording */}
            <Video
              src={staticFile("ai-visibility.mp4")}
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
