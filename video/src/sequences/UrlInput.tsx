import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const TYPED_TEXT = "ahrefs.com";
const TYPE_START = 80;
const TYPE_SPEED = 4;

export const UrlInput: React.FC = () => {
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

  // Phase 1 fade-out (faster)
  const textFadeOut = interpolate(frame, [30, 45], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 2: Form in 3D browser frame
  const screenVisible = frame >= 40;
  const screenEnter = spring({
    frame: frame - 45,
    fps,
    config: { damping: 14, mass: 0.8 },
  });
  const screenOpacity = interpolate(screenEnter, [0, 1], [0, 1]);
  const screenRotateY = interpolate(screenEnter, [0, 1], [-30, -12]);
  const screenRotateX = interpolate(screenEnter, [0, 1], [15, 5]);
  const screenScale = interpolate(screenEnter, [0, 1], [0.5, 0.75]);

  // Typing animation
  const typedChars = Math.min(
    Math.floor(
      interpolate(frame, [TYPE_START, TYPE_START + TYPED_TEXT.length * TYPE_SPEED], [0, TYPED_TEXT.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    ),
    TYPED_TEXT.length
  );
  const isTyping = frame >= TYPE_START;
  const currentText = TYPED_TEXT.slice(0, typedChars);
  const showCursor = isTyping && frame % 16 < 10;

  // Placeholder fade-out when typing starts
  const placeholderOpacity = interpolate(frame, [TYPE_START, TYPE_START + 8], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Input focus border color
  const focusBorder = isTyping ? "#6366f1" : "#d1d5db";
  const focusShadow = isTyping ? "0 0 0 3px rgba(99,102,241,0.15)" : "none";

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
            fontSize: 80,
            fontWeight: 800,
            fontFamily: "Inter, sans-serif",
            color: "#ffffff",
            letterSpacing: -2,
          }}
        >
          Type Your Site Url
        </div>
      </div>

      {/* Phase 2: 3D Browser frame with HTML form */}
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
              width: 1100,
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
                citeplex.io
              </div>
            </div>

            {/* Form content */}
            <div
              style={{
                background: "#ffffff",
                padding: "80px 120px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minHeight: 500,
                justifyContent: "center",
              }}
            >
              <div style={{ width: "100%", maxWidth: 560 }}>
                {/* Title */}
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#111827",
                    fontFamily: "Inter, sans-serif",
                    marginBottom: 12,
                  }}
                >
                  Add your website
                </div>

                {/* Subtitle */}
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 400,
                    color: "#6b7280",
                    fontFamily: "Inter, sans-serif",
                    marginBottom: 40,
                    lineHeight: 1.5,
                  }}
                >
                  We'll analyze your site to set up AI visibility tracking.
                </div>

                {/* Label */}
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#374151",
                    fontFamily: "Inter, sans-serif",
                    marginBottom: 8,
                  }}
                >
                  Website URL
                </div>

                {/* Input field */}
                <div
                  style={{
                    border: `2px solid ${focusBorder}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                    fontSize: 17,
                    fontFamily: "Inter, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 24,
                    boxShadow: focusShadow,
                    background: "#fff",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    minHeight: 24,
                    position: "relative",
                  }}
                >
                  {/* Placeholder */}
                  {placeholderOpacity > 0 && (
                    <span
                      style={{
                        color: "#9ca3af",
                        fontWeight: 400,
                        opacity: placeholderOpacity,
                        position: typedChars > 0 ? "absolute" : "relative",
                      }}
                    >
                      https://yoursite.com
                    </span>
                  )}

                  {/* Typed text */}
                  {isTyping && (
                    <span
                      style={{
                        color: "#111827",
                        fontWeight: 400,
                      }}
                    >
                      {currentText}
                    </span>
                  )}

                  {/* Blinking cursor */}
                  {isTyping && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 22,
                        background: "#6366f1",
                        marginLeft: 1,
                        opacity: showCursor ? 1 : 0,
                        borderRadius: 1,
                      }}
                    />
                  )}
                </div>

                {/* Button */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #8b9cf7 0%, #a78bfa 100%)",
                    borderRadius: 10,
                    padding: "16px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  {/* Sparkle icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
                  </svg>
                  <span
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#ffffff",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Analyze website
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
