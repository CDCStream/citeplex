import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export interface CursorKeyframe {
  frame: number;
  x: number;
  y: number;
  click?: boolean;
}

interface AnimatedCursorProps {
  keyframes: CursorKeyframe[];
  /** Pixel size of the cursor arrow */
  size?: number;
}

export const AnimatedCursor: React.FC<AnimatedCursorProps> = ({
  keyframes,
  size = 24,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (keyframes.length === 0) return null;

  const sortedKf = [...keyframes].sort((a, b) => a.frame - b.frame);

  let x = sortedKf[0].x;
  let y = sortedKf[0].y;

  if (frame <= sortedKf[0].frame) {
    x = sortedKf[0].x;
    y = sortedKf[0].y;
  } else if (frame >= sortedKf[sortedKf.length - 1].frame) {
    x = sortedKf[sortedKf.length - 1].x;
    y = sortedKf[sortedKf.length - 1].y;
  } else {
    for (let i = 0; i < sortedKf.length - 1; i++) {
      const curr = sortedKf[i];
      const next = sortedKf[i + 1];
      if (frame >= curr.frame && frame <= next.frame) {
        const progress = spring({
          frame: frame - curr.frame,
          fps,
          config: { damping: 18, mass: 0.6, stiffness: 120 },
          durationInFrames: next.frame - curr.frame,
        });
        x = interpolate(progress, [0, 1], [curr.x, next.x]);
        y = interpolate(progress, [0, 1], [curr.y, next.y]);
        break;
      }
    }
  }

  const activeClick = sortedKf.find(
    (kf) => kf.click && frame >= kf.frame && frame < kf.frame + 20
  );

  const clickProgress = activeClick
    ? (frame - activeClick.frame) / 20
    : 0;

  const cursorScale = activeClick
    ? interpolate(clickProgress, [0, 0.15, 0.4, 1], [1, 0.8, 1.05, 1], {
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${cursorScale})`,
        transformOrigin: "top left",
        pointerEvents: "none",
        zIndex: 100,
        filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.4))",
      }}
    >
      {/* Cursor arrow */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 3L19 12L12 13L9 20L5 3Z"
          fill="white"
          stroke="black"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </svg>

      {/* Click ripple */}
      {activeClick && (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "2px solid rgba(59,130,246,0.7)",
              transform: `translate(-50%, -50%) scale(${interpolate(
                clickProgress,
                [0, 1],
                [0.3, 2.5]
              )})`,
              opacity: interpolate(clickProgress, [0, 0.3, 1], [0, 0.8, 0], {
                extrapolateRight: "clamp",
              }),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "rgba(59,130,246,0.5)",
              transform: "translate(-50%, -50%)",
              opacity: interpolate(clickProgress, [0, 0.1, 0.5], [0, 1, 0], {
                extrapolateRight: "clamp",
              }),
            }}
          />
        </>
      )}
    </div>
  );
};
