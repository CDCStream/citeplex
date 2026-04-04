import React from "react";
import { Audio, staticFile, useVideoConfig } from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { GradientBackground } from "../components/GradientBackground";
import { SceneRenderer } from "../components/SceneRenderer";
import { HeyGenPiP } from "../components/HeyGenPiP";
import type { VideoConfig } from "../videos/types";

interface ShortsTemplateProps {
  config: VideoConfig;
}

export const ShortsTemplate: React.FC<ShortsTemplateProps> = ({ config }) => {
  const { width, height } = useVideoConfig();
  const transitionFrames = config.transitionDuration ?? 15;

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        background: "#0a0014",
      }}
    >
      <GradientBackground variant="default" pulse />

      <TransitionSeries>
        {config.scenes.map((scene, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <TransitionSeries.Transition
                presentation={fade()}
                timing={linearTiming({ durationInFrames: transitionFrames })}
              />
            )}
            <TransitionSeries.Sequence durationInFrames={scene.duration}>
              <SceneRenderer scene={scene} />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>

      {config.heygenVideo && (
        <HeyGenPiP
          src={config.heygenVideo}
          position={config.heygenPosition ?? "bottomRight"}
          size={config.heygenSize ?? 280}
          margin={30}
          enterFrame={config.heygenEnterFrame ?? 0}
          exitFrame={config.heygenExitFrame}
          volume={config.heygenVolume ?? 1}
        />
      )}

      {config.backgroundMusic && (
        <Audio
          src={staticFile(config.backgroundMusic)}
          volume={config.backgroundMusicVolume ?? 0.15}
        />
      )}
    </div>
  );
};
