"use client";

import type { AvatarScene } from "@video/videos/types";
import { FieldGroup } from "../PropertyPanel";
import { AssetPicker } from "../AssetPicker";
import { TextOverlayEditor } from "./TextOverlayEditor";

const BG_VARIANTS = ["default", "warm", "cool", "danger"] as const;

interface AvatarFormProps {
  scene: AvatarScene;
  onUpdate: (patch: Partial<AvatarScene>) => void;
}

export function AvatarForm({ scene, onUpdate }: AvatarFormProps) {
  return (
    <>
      <FieldGroup label="Avatar Video">
        <AssetPicker
          value={scene.src}
          onChange={(v) => onUpdate({ src: v })}
          accept="video"
        />
      </FieldGroup>

      <FieldGroup label="Volume">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={scene.volume ?? 1}
          onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <span className="text-[10px] text-text-muted">
          {Math.round((scene.volume ?? 1) * 100)}%
        </span>
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

      <FieldGroup label="Background">
        <div className="flex gap-1.5">
          {BG_VARIANTS.map((v) => (
            <button
              key={v}
              onClick={() => onUpdate({ backgroundVariant: v })}
              className={`rounded-md px-2.5 py-1 text-[10px] capitalize transition-colors ${
                (scene.backgroundVariant ?? "default") === v
                  ? "bg-primary text-white"
                  : "bg-surface-3 text-text-muted hover:bg-border"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Name Card">
        <div className="space-y-2">
          <input
            type="text"
            value={scene.nameCard?.name ?? ""}
            onChange={(e) =>
              onUpdate({
                nameCard: {
                  ...scene.nameCard,
                  name: e.target.value,
                  title: scene.nameCard?.title,
                },
              })
            }
            className="input-field w-full"
            placeholder="Name..."
          />
          <input
            type="text"
            value={scene.nameCard?.title ?? ""}
            onChange={(e) =>
              onUpdate({
                nameCard: {
                  name: scene.nameCard?.name ?? "",
                  title: e.target.value,
                },
              })
            }
            className="input-field w-full"
            placeholder="Title / role..."
          />
        </div>
      </FieldGroup>

      <TextOverlayEditor
        overlays={scene.subtitles ?? []}
        onChange={(subtitles) => onUpdate({ subtitles })}
        label="Subtitles"
      />
    </>
  );
}
