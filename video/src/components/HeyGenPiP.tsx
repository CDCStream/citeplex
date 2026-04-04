import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Video,
  staticFile,
} from "remotion";

export type PiPPosition = "bottomRight" | "bottomLeft" | "topRight" | "topLeft";

interface HeyGenPiPProps {
  /** Path relative to video/public/ (e.g. "marketing/avatar.mp4") */
  src: string;
  position?: PiPPosition;
  /** Diameter of the circular PiP window */
  size?: number;
  /** Margin from the canvas edge */
  margin?: number;
  /** Frame at which the PiP appears */
  enterFrame?: number;
  /** Frame at which the PiP disappears (leave undefined to persist) */
  exitFrame?: number;
  /** Border width */
  borderWidth?: number;
  /** Border color */
  borderColor?: string;
  /** Volume 0-1 */
  volume?: number;
}

export const HeyGenPiP: React.FC<HeyGenPiPProps> = ({
  src,
  position = "bottomRight",
  size = 200,
  margin = 40,
  enterFrame = 0,
  exitFrame,
  borderWidth = 3,
  borderColor = "rgba(168,85,247,0.8)",
  volume = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  if (!src || src.trim().length === 0) return null;

  const effectiveExit = exitFrame ?? durationInFrames;
  const enterDuration = 15;
  const exitDuration = 12;

  if (frame < enterFrame - 1 || frame > effectiveExit + exitDuration) {
    return null;
  }

  const enterProgress = spring({
    frame: Math.max(0, frame - enterFrame),
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 180 },
    durationInFrames: enterDuration,
  });

  const exitProgress =
    frame >= effectiveExit
      ? interpolate(
          frame,
          [effectiveExit, effectiveExit + exitDuration],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )
      : 1;

  const visibility = enterProgress * exitProgress;

  if (visibility <= 0.01) return null;

  const positionStyles: React.CSSProperties = {};
  switch (position) {
    case "bottomRight":
      positionStyles.bottom = margin;
      positionStyles.right = margin;
      break;
    case "bottomLeft":
      positionStyles.bottom = margin;
      positionStyles.left = margin;
      break;
    case "topRight":
      positionStyles.top = margin;
      positionStyles.right = margin;
      break;
    case "topLeft":
      positionStyles.top = margin;
      positionStyles.left = margin;
      break;
  }

  const pulseOpacity = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.5, 1]
  );

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles,
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        transform: `scale(${interpolate(visibility, [0, 1], [0.3, 1])})`,
        opacity: visibility,
        boxShadow: `0 0 ${20 * pulseOpacity}px rgba(168,85,247,${0.3 * pulseOpacity}), 0 8px 32px rgba(0,0,0,0.5)`,
        border: `${borderWidth}px solid ${borderColor}`,
        zIndex: 90,
      }}
    >
      <Video
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        volume={volume}
      />
    </div>
  );
};
