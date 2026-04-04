import React from "react";
import { ScreenRecordingPlayer } from "./ScreenRecordingPlayer";
import { AvatarFullScreen } from "./AvatarFullScreen";
import { TitleCard } from "./TitleCard";
import { SplitView } from "./SplitView";
import type { SceneConfig } from "../videos/types";

interface SceneRendererProps {
  scene: SceneConfig;
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({ scene }) => {
  switch (scene.type) {
    case "avatar":
      return <AvatarFullScreen scene={scene} />;

    case "title":
      return <TitleCard scene={scene} />;

    case "split":
      return <SplitView scene={scene} />;

    case "screen":
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
          }}
        >
          <div style={{ width: "100%", height: "100%" }}>
            <ScreenRecordingPlayer
              src={scene.screenRecording}
              cursor={scene.cursor}
              zoom={scene.zoom}
              textOverlays={scene.textOverlays}
              showChrome={scene.showChrome ?? true}
              volume={scene.volume ?? 0}
              playbackRate={scene.playbackRate}
              startFrom={scene.startFrom}
            />
          </div>
        </div>
      );

    default: {
      const _exhaustive: never = scene;
      return null;
    }
  }
};
