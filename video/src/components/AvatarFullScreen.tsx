import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  Video,
  staticFile,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { GradientBackground } from "./GradientBackground";
import type { AvatarScene } from "../videos/types";
import type { TextOverlayConfig } from "./ScreenRecordingPlayer";

interface AvatarFullScreenProps {
  scene: AvatarScene;
}

const SubtitleOverlay: React.FC<{
  config: TextOverlayConfig;
  currentFrame: number;
}> = ({ config, currentFrame }) => {
  const relFrame = currentFrame - config.frame;
  if (relFrame < 0 || relFrame > config.duration) return null;

  const fadeIn = 8;
  const fadeOut = 8;
  const opacity = interpolate(
    relFrame,
    [0, fadeIn, config.duration - fadeOut, config.duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        opacity,
        fontSize: config.fontSize ?? 28,
        fontWeight: 600,
        color: config.color ?? "#ffffff",
        fontFamily: "Inter, sans-serif",
        textAlign: "center",
        maxWidth: "80%",
        padding: "10px 28px",
        borderRadius: 10,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(10px)",
        textShadow: "0 1px 6px rgba(0,0,0,0.4)",
        zIndex: 20,
      }}
    >
      {config.text}
    </div>
  );
};

const NameCard: React.FC<{
  name: string;
  title?: string;
  frame: number;
  fps: number;
}> = ({ name, title, frame, fps }) => {
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.5, stiffness: 160 },
    durationInFrames: 20,
  });

  const slideX = interpolate(enterProgress, [0, 1], [-200, 0]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 160,
        left: 50,
        opacity: enterProgress,
        transform: `translateX(${slideX}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "12px 24px",
        borderRadius: 10,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
        borderLeft: "3px solid #a855f7",
        zIndex: 20,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#ffffff",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {name}
      </div>
      {title && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "rgba(255,255,255,0.65)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
};

export const AvatarFullScreen: React.FC<AvatarFullScreenProps> = ({
  scene,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <GradientBackground
        variant={scene.backgroundVariant ?? "default"}
        pulse={false}
      />

      {scene.src && scene.src.trim().length > 0 ? (
        <Video
          src={staticFile(scene.src)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          volume={scene.volume ?? 1}
          startFrom={
            scene.startFrom ? Math.round(scene.startFrom * fps) : undefined
          }
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.3)",
            fontSize: 20,
            fontFamily: "Inter, sans-serif",
          }}
        >
          No avatar video selected
        </div>
      )}

      {scene.nameCard && (
        <NameCard
          name={scene.nameCard.name}
          title={scene.nameCard.title}
          frame={frame}
          fps={fps}
        />
      )}

      {scene.subtitles?.map((sub, i) => (
        <SubtitleOverlay key={i} config={sub} currentFrame={frame} />
      ))}
    </div>
  );
};
