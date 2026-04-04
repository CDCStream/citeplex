import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  Video,
  staticFile,
  interpolate,
  Easing,
} from "remotion";
import { AnimatedCursor, CursorKeyframe } from "./AnimatedCursor";
import { ZoomEffect, ZoomKeyframe } from "./ZoomEffect";

export interface TextOverlayConfig {
  text: string;
  /** Frame at which the text appears */
  frame: number;
  /** How many frames the text stays visible */
  duration: number;
  position?: "top" | "bottom" | "center";
  fontSize?: number;
  color?: string;
}

interface ScreenRecordingPlayerProps {
  /** Path relative to video/public/ (e.g. "marketing/demo.mp4") */
  src: string;
  cursor?: CursorKeyframe[];
  zoom?: ZoomKeyframe[];
  textOverlays?: TextOverlayConfig[];
  /** Show a browser-style chrome around the recording */
  showChrome?: boolean;
  /** Volume 0-1 */
  volume?: number;
  /** Playback rate multiplier */
  playbackRate?: number;
  /** Start playback from this second in the source video */
  startFrom?: number;
}

const BrowserChrome: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      border: "1px solid rgba(255,255,255,0.1)",
    }}
  >
    {/* Title bar */}
    <div
      style={{
        height: 36,
        background: "#1e1e2e",
        display: "flex",
        alignItems: "center",
        paddingLeft: 14,
        gap: 8,
        flexShrink: 0,
      }}
    >
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
      <div
        style={{
          marginLeft: 16,
          flex: 1,
          height: 22,
          borderRadius: 6,
          background: "rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "rgba(255,255,255,0.35)",
          fontFamily: "Inter, sans-serif",
          marginRight: 80,
        }}
      >
        citeplex.io
      </div>
    </div>
    {/* Content */}
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      {children}
    </div>
  </div>
);

const TextOverlay: React.FC<{
  config: TextOverlayConfig;
  currentFrame: number;
}> = ({ config, currentFrame }) => {
  const relFrame = currentFrame - config.frame;
  if (relFrame < 0 || relFrame > config.duration) return null;

  const fadeInEnd = 12;
  const fadeOutStart = config.duration - 12;

  const opacity = interpolate(
    relFrame,
    [0, fadeInEnd, fadeOutStart, config.duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const slideY = interpolate(relFrame, [0, fadeInEnd], [20, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const positionStyles: React.CSSProperties = {};
  switch (config.position ?? "bottom") {
    case "top":
      positionStyles.top = 40;
      positionStyles.left = "50%";
      positionStyles.transform = `translateX(-50%) translateY(${slideY}px)`;
      break;
    case "center":
      positionStyles.top = "50%";
      positionStyles.left = "50%";
      positionStyles.transform = `translate(-50%, -50%) translateY(${slideY}px)`;
      break;
    case "bottom":
    default:
      positionStyles.bottom = 40;
      positionStyles.left = "50%";
      positionStyles.transform = `translateX(-50%) translateY(${-slideY}px)`;
      break;
  }

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles,
        opacity,
        fontSize: config.fontSize ?? 32,
        fontWeight: 700,
        color: config.color ?? "#ffffff",
        fontFamily: "Inter, sans-serif",
        textShadow: "0 2px 12px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3)",
        whiteSpace: "nowrap",
        zIndex: 50,
        padding: "8px 24px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
      }}
    >
      {config.text}
    </div>
  );
};

export const ScreenRecordingPlayer: React.FC<ScreenRecordingPlayerProps> = ({
  src,
  cursor = [],
  zoom = [],
  textOverlays = [],
  showChrome = true,
  volume = 0,
  playbackRate = 1,
  startFrom = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const videoContent = (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ZoomEffect keyframes={zoom}>
        <Video
          src={staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          volume={volume}
          playbackRate={playbackRate}
          startFrom={Math.round(startFrom * fps)}
        />
        {cursor.length > 0 && <AnimatedCursor keyframes={cursor} />}
      </ZoomEffect>

      {textOverlays.map((overlay, i) => (
        <TextOverlay key={i} config={overlay} currentFrame={frame} />
      ))}
    </div>
  );

  if (showChrome) {
    return <BrowserChrome>{videoContent}</BrowserChrome>;
  }

  return videoContent;
};
