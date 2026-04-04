import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  Video,
  staticFile,
  interpolate,
  spring,
} from "remotion";
import { ScreenRecordingPlayer } from "./ScreenRecordingPlayer";
import { GradientBackground } from "./GradientBackground";
import type { SplitScene } from "../videos/types";

interface SplitViewProps {
  scene: SplitScene;
}

export const SplitView: React.FC<SplitViewProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const ratio = scene.avatarRatio ?? 0.4;
  const direction = scene.direction ?? "horizontal";
  const isHorizontal = direction === "horizontal";

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.6, stiffness: 140 },
    durationInFrames: 22,
  });

  const dividerProgress = interpolate(slideIn, [0, 1], [0, 1]);

  const avatarSize = isHorizontal
    ? { width: `${ratio * 100}%` as const, height: "100%" as const }
    : { width: "100%" as const, height: `${ratio * 100}%` as const };

  const screenSize = isHorizontal
    ? { width: `${(1 - ratio) * 100}%` as const, height: "100%" as const }
    : { width: "100%" as const, height: `${(1 - ratio) * 100}%` as const };

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <GradientBackground variant="default" pulse={false} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: isHorizontal ? "row" : "column",
        }}
      >
        {/* Avatar side */}
        <div
          style={{
            ...avatarSize,
            position: "relative",
            overflow: "hidden",
            opacity: slideIn,
            transform: isHorizontal
              ? `translateX(${interpolate(slideIn, [0, 1], [-40, 0])}px)`
              : `translateY(${interpolate(slideIn, [0, 1], [-40, 0])}px)`,
          }}
        >
          <Video
            src={staticFile(scene.avatarSrc)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            volume={scene.avatarVolume ?? 1}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            ...(isHorizontal
              ? { width: 3, height: "100%" }
              : { width: "100%", height: 3 }),
            background: `linear-gradient(${isHorizontal ? "to bottom" : "to right"}, transparent, rgba(168,85,247,${0.6 * dividerProgress}), transparent)`,
            flexShrink: 0,
          }}
        />

        {/* Screen recording side */}
        <div
          style={{
            ...screenSize,
            position: "relative",
            overflow: "hidden",
            opacity: slideIn,
            transform: isHorizontal
              ? `translateX(${interpolate(slideIn, [0, 1], [40, 0])}px)`
              : `translateY(${interpolate(slideIn, [0, 1], [40, 0])}px)`,
            padding: 16,
          }}
        >
          <ScreenRecordingPlayer
            src={scene.screenRecording}
            cursor={scene.cursor}
            zoom={scene.zoom}
            textOverlays={scene.textOverlays}
            showChrome={scene.showChrome ?? true}
            volume={0}
          />
        </div>
      </div>
    </div>
  );
};
