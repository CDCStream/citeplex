import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Logo drops in (frame 5+)
  const logoSpring = spring({ frame: frame - 5, fps, config: { damping: 10, mass: 0.6 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.2, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);
  const logoRotate = interpolate(logoSpring, [0, 1], [-15, 0]);

  // Phase 2: Brand name slides in (frame 20+)
  const nameSpring = spring({ frame: frame - 20, fps, config: { damping: 14, mass: 0.7 } });
  const nameOpacity = interpolate(nameSpring, [0, 1], [0, 1]);
  const nameY = interpolate(nameSpring, [0, 1], [40, 0]);

  // Phase 3: Logo + name move up, CTA appears (frame 70+)
  const liftUp = interpolate(frame, [70, 95], [0, -80], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaSpring = spring({ frame: frame - 90, fps, config: { damping: 14, mass: 0.8 } });
  const ctaOpacity = interpolate(ctaSpring, [0, 1], [0, 1]);
  const ctaY = interpolate(ctaSpring, [0, 1], [60, 0]);

  // Tagline
  const tagSpring = spring({ frame: frame - 100, fps, config: { damping: 14, mass: 0.7 } });
  const tagOpacity = interpolate(tagSpring, [0, 1], [0, 1]);

  // Button pulse
  const buttonSpring = spring({ frame: frame - 115, fps, config: { damping: 12, mass: 0.6 } });
  const buttonScale = interpolate(buttonSpring, [0, 1], [0.8, 1]);
  const buttonOpacity = interpolate(buttonSpring, [0, 1], [0, 1]);

  // Price
  const priceSpring = spring({ frame: frame - 125, fps, config: { damping: 14, mass: 0.7 } });
  const priceOpacity = interpolate(priceSpring, [0, 1], [0, 1]);

  // Floating orbs
  const orb1X = 300 + Math.sin(frame * 0.02) * 60;
  const orb1Y = 250 + Math.cos(frame * 0.015) * 50;
  const orb2X = 1350 + Math.sin(frame * 0.025 + 2) * 80;
  const orb2Y = 550 + Math.cos(frame * 0.018 + 1) * 60;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 80% 60% at 50% 45%, rgba(168,85,247,0.1) 0%, transparent 70%)",
        }}
      />

      {/* Floating orbs */}
      <div
        style={{
          position: "absolute",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
          left: orb1X, top: orb1Y, filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)",
          left: orb2X, top: orb2Y, filter: "blur(60px)",
        }}
      />

      {/* Content container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          transform: `translateY(${liftUp}px)`,
        }}
      >
        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
            marginBottom: 20,
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{ width: 130, height: 130, objectFit: "contain" }}
          />
        </div>

        {/* Brand name */}
        <div
          style={{
            opacity: nameOpacity,
            transform: `translateY(${nameY}px)`,
            fontSize: 96,
            fontWeight: 900,
            fontFamily: "Inter, sans-serif",
            letterSpacing: -3,
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          <span style={{ color: "#ffffff" }}>Cite</span>
          <span style={{ color: "#38bdf8" }}>plex</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: tagOpacity,
            fontSize: 24,
            fontWeight: 500,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "Inter, sans-serif",
            letterSpacing: 1,
            marginBottom: 50,
          }}
        >
          Boost your SEO, AEO & GEO with AI
        </div>

        {/* CTA section */}
        <div
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Sign up button */}
          <div
            style={{
              opacity: buttonOpacity,
              transform: `scale(${buttonScale})`,
              background: "linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #38bdf8 100%)",
              borderRadius: 16,
              padding: "20px 64px",
              boxShadow: "0 0 40px rgba(168,85,247,0.3), 0 0 80px rgba(99,102,241,0.15)",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#ffffff",
                fontFamily: "Inter, sans-serif",
                letterSpacing: 0.5,
              }}
            >
              Sign Up Free — 14-Day Trial
            </div>
          </div>

          {/* Price */}
          <div
            style={{
              opacity: priceOpacity,
              fontSize: 18,
              fontWeight: 500,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Plans starting from{" "}
            <span style={{ color: "#a855f7", fontWeight: 700 }}>$69/mo</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
