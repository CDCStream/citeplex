import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";

interface MockBrowserProps {
  screenshotFile: string;
  startFrame?: number;
  rotateY?: number;
  rotateX?: number;
  scale?: number;
  glowColor?: string;
}

export const MockBrowser: React.FC<MockBrowserProps> = ({
  screenshotFile,
  startFrame = 0,
  rotateY = -15,
  rotateX = 5,
  scale = 0.85,
  glowColor = "#a855f7",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relFrame = frame - startFrame;

  if (relFrame < 0) return null;

  const enter = spring({ frame: relFrame, fps, config: { damping: 14, mass: 0.8 } });

  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const currentRotateY = interpolate(enter, [0, 1], [rotateY * 2, rotateY]);
  const currentRotateX = interpolate(enter, [0, 1], [rotateX + 10, rotateX]);
  const currentScale = interpolate(enter, [0, 1], [scale * 0.7, scale]);

  return (
    <div
      style={{
        perspective: 1200,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <div
        style={{
          transform: `rotateY(${currentRotateY}deg) rotateX(${currentRotateX}deg) scale(${currentScale})`,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: `0 0 80px ${glowColor}40, 0 0 160px ${glowColor}20, 0 20px 60px rgba(0,0,0,0.5)`,
          border: `1px solid ${glowColor}30`,
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
            citeplex.io/dashboard
          </div>
        </div>
        {/* Screenshot */}
        <Img
          src={staticFile(`screenshots/${screenshotFile}`)}
          style={{
            width: 1200,
            height: 750,
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};
