import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const HOWTO_PROMPTS = [
  "How to use Ahrefs for keyword research",
  "How to do a site audit with Ahrefs",
  "How to find backlink opportunities with Ahrefs",
  "How to track keyword rankings with Ahrefs",
  "How to analyze competitor traffic with Ahrefs",
];

const CUSTOM_PROMPT = "Best SEO tools for small business";

// Animation timing
const SCREEN_START = 40;
const SELECT_START = 70;
const SELECT_INTERVAL = 18;
const CUSTOM_TYPE_START = 130;
const CUSTOM_TYPE_SPEED = 3;

export const Prompts: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Text slide-in
  const textSlide = spring({
    frame: frame - 5,
    fps,
    config: { damping: 14, mass: 0.7 },
  });
  const textOpacity = interpolate(textSlide, [0, 1], [0, 1]);
  const textX = interpolate(textSlide, [0, 1], [-200, 0]);
  const textFadeOut = interpolate(frame, [55, 68], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 2: Screen enter
  const screenVisible = frame >= SCREEN_START;
  const screenEnter = spring({
    frame: frame - SCREEN_START - 5,
    fps,
    config: { damping: 14, mass: 0.8 },
  });
  const screenOpacity = interpolate(screenEnter, [0, 1], [0, 1]);
  const screenRotateY = interpolate(screenEnter, [0, 1], [25, 10]);
  const screenRotateX = interpolate(screenEnter, [0, 1], [12, 4]);
  const screenScale = interpolate(screenEnter, [0, 1], [0.5, 0.7]);

  // Prompt selection state (3 prompts get selected one by one)
  const selectedIndices: number[] = [];
  for (let i = 0; i < 3; i++) {
    const selectFrame = SELECT_START + i * SELECT_INTERVAL;
    if (frame >= selectFrame) {
      selectedIndices.push(i);
    }
  }

  // Custom prompt typing
  const customTypedChars = Math.min(
    Math.floor(
      interpolate(
        frame,
        [CUSTOM_TYPE_START, CUSTOM_TYPE_START + CUSTOM_PROMPT.length * CUSTOM_TYPE_SPEED],
        [0, CUSTOM_PROMPT.length],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    ),
    CUSTOM_PROMPT.length
  );
  const isCustomTyping = frame >= CUSTOM_TYPE_START;
  const customText = CUSTOM_PROMPT.slice(0, customTypedChars);
  const showCustomCursor = isCustomTyping && frame % 16 < 10;

  const selectedCount = selectedIndices.length + (customTypedChars === CUSTOM_PROMPT.length ? 1 : 0);
  const totalLimit = 15;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Phase 1: Center text */}
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
            fontSize: 72,
            fontWeight: 800,
            fontFamily: "Inter, sans-serif",
            color: "#ffffff",
            letterSpacing: -2,
            textAlign: "center",
            maxWidth: 1100,
            lineHeight: 1.15,
          }}
        >
          Select and Type AI Prompts you track
        </div>
      </div>

      {/* Phase 2: 3D Browser with prompt page */}
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
              boxShadow:
                "0 0 80px rgba(168,85,247,0.25), 0 0 160px rgba(168,85,247,0.1), 0 20px 60px rgba(0,0,0,0.5)",
              border: "1px solid rgba(168,85,247,0.2)",
              width: 1200,
            }}
          >
            {/* Browser chrome */}
            <div
              style={{
                background: "linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
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
                  padding: "6px 14px",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                citeplex.io/onboarding
              </div>
            </div>

            {/* Page content */}
            <div
              style={{
                background: "#ffffff",
                padding: "50px 80px",
                minHeight: 650,
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#111827",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  AI Visibility Prompts
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    fontFamily: "Inter, sans-serif",
                    marginTop: 4,
                  }}
                >
                  Select the prompts we'll track across 7 AI engines daily.
                </div>
              </div>

              {/* Quota bar */}
              <div
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    fontFamily: "Inter, sans-serif",
                    marginBottom: 6,
                  }}
                >
                  <span>{selectedCount} / {totalLimit} prompts selected</span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: "#e5e7eb",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(selectedCount / totalLimit) * 100}%`,
                      background: "#7c3aed",
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>

              {/* How To category */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#9ca3af",
                  fontFamily: "Inter, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                How To
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 400,
                    background: "#f3f4f6",
                    padding: "2px 8px",
                    borderRadius: 10,
                  }}
                >
                  {selectedIndices.length}/{HOWTO_PROMPTS.length}
                </span>
              </div>

              {/* Prompt list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
                {HOWTO_PROMPTS.map((prompt, i) => {
                  const isSelected = selectedIndices.includes(i);
                  const selectFrame = SELECT_START + selectedIndices.indexOf(i) * SELECT_INTERVAL;
                  const selectAnim = isSelected
                    ? spring({ frame: frame - selectFrame, fps, config: { damping: 14, mass: 0.5 } })
                    : 0;

                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: isSelected ? "1px solid rgba(124,58,237,0.25)" : "1px solid transparent",
                        background: isSelected ? "rgba(124,58,237,0.04)" : "rgba(249,250,251,0.8)",
                        opacity: isSelected ? 1 : 0.5,
                        fontSize: 14,
                        fontFamily: "Inter, sans-serif",
                        color: "#374151",
                        transform: isSelected ? `scale(${interpolate(selectAnim, [0, 1], [0.97, 1])})` : undefined,
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: isSelected ? "2px solid #7c3aed" : "2px solid #d1d5db",
                          background: isSelected ? "#7c3aed" : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span style={{ flex: 1 }}>{prompt}</span>
                    </div>
                  );
                })}
              </div>

              {/* Custom prompt input */}
              <div style={{ display: "flex", gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    border: isCustomTyping ? "2px solid #6366f1" : "2px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 14,
                    fontFamily: "Inter, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    background: "#fff",
                    boxShadow: isCustomTyping ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
                    minHeight: 20,
                  }}
                >
                  {!isCustomTyping && (
                    <span style={{ color: "#9ca3af" }}>Add a custom prompt...</span>
                  )}
                  {isCustomTyping && (
                    <>
                      <span style={{ color: "#111827" }}>{customText}</span>
                      <span
                        style={{
                          display: "inline-block",
                          width: 2,
                          height: 18,
                          background: "#6366f1",
                          marginLeft: 1,
                          opacity: showCustomCursor ? 1 : 0,
                          borderRadius: 1,
                        }}
                      />
                    </>
                  )}
                </div>
                {/* Plus button */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    border: "2px solid #e5e7eb",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: "#fff",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
