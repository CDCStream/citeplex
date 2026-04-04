import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface GradientBackgroundProps {
  variant?: "default" | "warm" | "cool" | "danger";
  pulse?: boolean;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  variant = "default",
  pulse = true,
}) => {
  const frame = useCurrentFrame();

  const gradients: Record<string, string[]> = {
    default: ["#0a0014", "#1a0030", "#0a0020"],
    warm: ["#0a0014", "#200020", "#1a0010"],
    cool: ["#000a1a", "#001030", "#000820"],
    danger: ["#1a0000", "#200005", "#100000"],
  };

  const colors = gradients[variant] || gradients.default;

  const pulseOpacity = pulse
    ? interpolate(Math.sin(frame * 0.03), [-1, 1], [0.3, 0.6])
    : 0.4;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${colors[1]} 0%, ${colors[0]} 70%, ${colors[2]} 100%)`,
      }}
    >
      {/* Subtle animated orb */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, #a855f7${Math.round(pulseOpacity * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${1 + Math.sin(frame * 0.02) * 0.1})`,
          filter: "blur(80px)",
        }}
      />
    </div>
  );
};
