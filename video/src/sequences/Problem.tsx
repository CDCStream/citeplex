import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const AI_ENGINES = [
  { file: "engines/chatgpt-white.webp", name: "ChatGPT" },
  { file: "engines/gemini-logo.png", name: "Gemini" },
  { file: "engines/claude-logo.png", name: "Claude" },
  { file: "engines/perplexity-logo.png", name: "Perplexity" },
  { file: "engines/deepseek-logo.png", name: "DeepSeek" },
  { file: "engines/grok-white.png", name: "Grok" },
  { file: "engines/mistral-logo.png", name: "Mistral" },
];

const GOOGLE = { file: "google.svg.png", name: "Google" };

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Phase 1: Text slide-in animation (frame 0-80) ---
  const slideIn = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, mass: 0.7 },
  });
  const textOpacity = interpolate(slideIn, [0, 1], [0, 1]);
  const textX = interpolate(slideIn, [0, 1], [-200, 0]);
  const textFadeOut = interpolate(frame, [90, 110], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textPhaseOpacity = Math.min(textOpacity, textFadeOut);

  // --- Phase 2: Logos appear (frame 100+) ---
  const logosVisible = frame >= 100;
  const logoStartFrame = 110;
  const allLogos = [...AI_ENGINES, GOOGLE];

  // Background floating orbs
  const orb1X = 300 + Math.sin(frame * 0.015) * 80;
  const orb1Y = 200 + Math.cos(frame * 0.012) * 60;
  const orb2X = 1400 + Math.sin(frame * 0.018 + 2) * 100;
  const orb2Y = 600 + Math.cos(frame * 0.014 + 1) * 70;
  const orb3X = 900 + Math.sin(frame * 0.02 + 4) * 60;
  const orb3Y = 150 + Math.cos(frame * 0.016 + 3) * 50;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Ambient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(88,28,135,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Floating orbs */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          left: orb1X,
          top: orb1Y,
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
          left: orb2X,
          top: orb2Y,
          filter: "blur(50px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)",
          left: orb3X,
          top: orb3Y,
          filter: "blur(40px)",
        }}
      />

      {/* Subtle grid lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(168,85,247,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168,85,247,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          opacity: interpolate(frame, [100, 130], [0, 0.6], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      {/* Phase 1: Center text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          opacity: textPhaseOpacity,
          transform: `translateX(${textX}px)`,
        }}
      >
        <div
          style={{
            fontSize: 76,
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
          From Both{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #a855f7, #6366f1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AI
          </span>{" "}
          and{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #38bdf8, #6366f1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Search Engines
          </span>
        </div>
      </div>

      {/* Phase 2: Logo grid */}
      {logosVisible && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 32,
              flexWrap: "wrap",
              justifyContent: "center",
              maxWidth: 1200,
              padding: "0 60px",
            }}
          >
            {allLogos.map((logo, i) => {
              const delay = logoStartFrame + i * 6;
              const sc = spring({
                frame: frame - delay,
                fps,
                config: { damping: 12, mass: 0.6 },
              });
              const logoOpacity = interpolate(sc, [0, 1], [0, 1]);
              const logoScale = interpolate(sc, [0, 1], [0.4, 1]);

              const isGoogle = logo.name === "Google";
              const isChatGPT = logo.name === "ChatGPT";
              const imgSize = isChatGPT ? 80 : 56;

              return (
                <div
                  key={logo.name}
                  style={{
                    opacity: logoOpacity,
                    transform: `scale(${logoScale})`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    background: isGoogle
                      ? "rgba(66,133,244,0.06)"
                      : "rgba(168,85,247,0.05)",
                    border: `1px solid ${isGoogle ? "rgba(66,133,244,0.15)" : "rgba(168,85,247,0.12)"}`,
                    borderRadius: 20,
                    padding: "28px 24px 20px",
                    width: 150,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "visible",
                    }}
                  >
                    <Img
                      src={staticFile(logo.file)}
                      style={{
                        maxWidth: imgSize,
                        maxHeight: imgSize,
                        objectFit: "contain",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "Inter, sans-serif",
                      textAlign: "center",
                    }}
                  >
                    {logo.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
