"use client";

import type { ScreenScene } from "@remotion/videos/types";
import { FieldGroup } from "../PropertyPanel";
import { AssetPicker } from "../AssetPicker";
import { CursorEditor } from "./CursorEditor";
import { ZoomEditor } from "./ZoomEditor";
import { TextOverlayEditor } from "./TextOverlayEditor";

interface ScreenFormProps {
  scene: ScreenScene;
  onUpdate: (patch: Partial<ScreenScene>) => void;
}

export function ScreenForm({ scene, onUpdate }: ScreenFormProps) {
  return (
    <>
      <FieldGroup label="Screen Recording">
        <AssetPicker
          value={scene.screenRecording}
          onChange={(v) => onUpdate({ screenRecording: v })}
          accept="video"
        />
      </FieldGroup>

      <FieldGroup label="Show Browser Chrome">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={scene.showChrome ?? true}
            onChange={(e) => onUpdate({ showChrome: e.target.checked })}
            className="accent-primary"
          />
          <span className="text-xs text-text">Browser frame around video</span>
        </label>
      </FieldGroup>

      <FieldGroup label="Volume">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={scene.volume ?? 0}
          onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <span className="text-[10px] text-text-muted">
          {Math.round((scene.volume ?? 0) * 100)}%
        </span>
      </FieldGroup>

      <FieldGroup label="Playback Rate">
        <input
          type="number"
          value={scene.playbackRate ?? 1}
          onChange={(e) => onUpdate({ playbackRate: Number(e.target.value) })}
          min={0.25}
          max={4}
          step={0.25}
          className="input-field w-24"
        />
      </FieldGroup>

      <FieldGroup label="Start From (frame)">
        <input
          type="number"
          value={scene.startFrom ?? 0}
          onChange={(e) => onUpdate({ startFrom: Number(e.target.value) })}
          min={0}
          className="input-field w-24"
        />
      </FieldGroup>

      <CursorEditor
        keyframes={scene.cursor ?? []}
        onChange={(cursor) => onUpdate({ cursor })}
      />

      <ZoomEditor
        keyframes={scene.zoom ?? []}
        onChange={(zoom) => onUpdate({ zoom })}
      />

      <TextOverlayEditor
        overlays={scene.textOverlays ?? []}
        onChange={(textOverlays) => onUpdate({ textOverlays })}
      />
    </>
  );
}
