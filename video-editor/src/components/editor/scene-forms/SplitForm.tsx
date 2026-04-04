"use client";

import type { SplitScene } from "@remotion/videos/types";
import { FieldGroup } from "../PropertyPanel";
import { AssetPicker } from "../AssetPicker";
import { CursorEditor } from "./CursorEditor";
import { ZoomEditor } from "./ZoomEditor";
import { TextOverlayEditor } from "./TextOverlayEditor";

interface SplitFormProps {
  scene: SplitScene;
  onUpdate: (patch: Partial<SplitScene>) => void;
}

export function SplitForm({ scene, onUpdate }: SplitFormProps) {
  return (
    <>
      <FieldGroup label="Avatar Video">
        <AssetPicker
          value={scene.avatarSrc}
          onChange={(v) => onUpdate({ avatarSrc: v })}
          accept="video"
        />
      </FieldGroup>

      <FieldGroup label="Avatar Volume">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={scene.avatarVolume ?? 1}
          onChange={(e) => onUpdate({ avatarVolume: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <span className="text-[10px] text-text-muted">
          {Math.round((scene.avatarVolume ?? 1) * 100)}%
        </span>
      </FieldGroup>

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
          <span className="text-xs text-text">Browser frame</span>
        </label>
      </FieldGroup>

      <FieldGroup label="Avatar Ratio">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0.2}
            max={0.8}
            step={0.05}
            value={scene.avatarRatio ?? 0.4}
            onChange={(e) => onUpdate({ avatarRatio: Number(e.target.value) })}
            className="flex-1 accent-primary"
          />
          <span className="text-[10px] text-text-muted w-10 text-right">
            {Math.round((scene.avatarRatio ?? 0.4) * 100)}%
          </span>
        </div>
      </FieldGroup>

      <FieldGroup label="Direction">
        <div className="flex gap-1.5">
          {(["horizontal", "vertical"] as const).map((d) => (
            <button
              key={d}
              onClick={() => onUpdate({ direction: d })}
              className={`rounded-md px-2.5 py-1 text-[10px] capitalize transition-colors ${
                (scene.direction ?? "horizontal") === d
                  ? "bg-primary text-white"
                  : "bg-surface-3 text-text-muted hover:bg-border"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
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
