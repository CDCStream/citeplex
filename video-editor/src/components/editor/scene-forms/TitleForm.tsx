"use client";

import type { TitleScene } from "@video/videos/types";
import { FieldGroup } from "../PropertyPanel";

const BG_VARIANTS = ["default", "warm", "cool", "danger"] as const;

interface TitleFormProps {
  scene: TitleScene;
  onUpdate: (patch: Partial<TitleScene>) => void;
}

export function TitleForm({ scene, onUpdate }: TitleFormProps) {
  return (
    <>
      <FieldGroup label="Title">
        <input
          type="text"
          value={scene.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="input-field w-full"
          placeholder="Enter title..."
        />
      </FieldGroup>

      <FieldGroup label="Subtitle">
        <input
          type="text"
          value={scene.subtitle ?? ""}
          onChange={(e) => onUpdate({ subtitle: e.target.value })}
          className="input-field w-full"
          placeholder="Optional subtitle..."
        />
      </FieldGroup>

      <FieldGroup label="Show Logo">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={scene.showLogo ?? false}
            onChange={(e) => onUpdate({ showLogo: e.target.checked })}
            className="accent-primary"
          />
          <span className="text-xs text-text">Display Citeplex logo</span>
        </label>
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

      <FieldGroup label="Title Font Size">
        <input
          type="number"
          value={scene.titleFontSize ?? 72}
          onChange={(e) => onUpdate({ titleFontSize: Number(e.target.value) })}
          min={16}
          max={200}
          className="input-field w-24"
        />
      </FieldGroup>

      <FieldGroup label="Subtitle Font Size">
        <input
          type="number"
          value={scene.subtitleFontSize ?? 32}
          onChange={(e) =>
            onUpdate({ subtitleFontSize: Number(e.target.value) })
          }
          min={12}
          max={120}
          className="input-field w-24"
        />
      </FieldGroup>
    </>
  );
}
