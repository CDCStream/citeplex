import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

export interface ZoomKeyframe {
  /** Frame at which the zoom begins */
  frame: number;
  /** Focal point X (pixel coordinate in the original canvas) */
  x: number;
  /** Focal point Y */
  y: number;
  /** Target scale (e.g. 2 = 200%) */
  scale: number;
  /** How many frames the zoom-in transition takes */
  easeIn?: number;
  /** How many frames to hold at full zoom */
  hold?: number;
  /** How many frames the zoom-out transition takes */
  easeOut?: number;
}

interface ZoomEffectProps {
  keyframes: ZoomKeyframe[];
  /** Canvas width used to compute transform-origin percentages */
  width?: number;
  /** Canvas height */
  height?: number;
  children: React.ReactNode;
}

export const ZoomEffect: React.FC<ZoomEffectProps> = ({
  keyframes,
  width = 1920,
  height = 1080,
  children,
}) => {
  const frame = useCurrentFrame();

  let scale = 1;
  let originX = 50;
  let originY = 50;

  for (const kf of keyframes) {
    const easeIn = kf.easeIn ?? 20;
    const hold = kf.hold ?? 30;
    const easeOut = kf.easeOut ?? 20;

    const zoomStart = kf.frame;
    const holdStart = zoomStart + easeIn;
    const holdEnd = holdStart + hold;
    const zoomEnd = holdEnd + easeOut;

    if (frame >= zoomStart && frame < zoomEnd) {
      originX = (kf.x / width) * 100;
      originY = (kf.y / height) * 100;

      if (frame < holdStart) {
        scale = interpolate(frame, [zoomStart, holdStart], [1, kf.scale], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
      } else if (frame < holdEnd) {
        scale = kf.scale;
      } else {
        scale = interpolate(frame, [holdEnd, zoomEnd], [kf.scale, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });
      }
      break;
    }
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transformOrigin: `${originX}% ${originY}%`,
        transform: `scale(${scale})`,
        willChange: scale !== 1 ? "transform" : undefined,
      }}
    >
      {children}
    </div>
  );
};
