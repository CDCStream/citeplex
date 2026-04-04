"use client";

import { useEditorStore } from "@/store/editor-store";
import { FieldGroup } from "./PropertyPanel";
import { AssetPicker } from "./AssetPicker";

const PIP_POSITIONS = [
  "bottomRight",
  "bottomLeft",
  "topRight",
  "topLeft",
] as const;

export function GlobalSettings() {
  const config = useEditorStore((s) => s.config);
  const updateGlobal = useEditorStore((s) => s.updateGlobal);

  return (
    <>
      <FieldGroup label="Video ID">
        <input
          type="text"
          value={config.id}
          onChange={(e) => updateGlobal({ id: e.target.value })}
          className="input-field w-full"
          placeholder="MyVideo"
        />
      </FieldGroup>

      <FieldGroup label="Title">
        <input
          type="text"
          value={config.title}
          onChange={(e) => updateGlobal({ title: e.target.value })}
          className="input-field w-full"
          placeholder="Video title..."
        />
      </FieldGroup>

      <FieldGroup label="FPS">
        <div className="flex gap-1.5">
          {[24, 30, 60].map((f) => (
            <button
              key={f}
              onClick={() => updateGlobal({ fps: f })}
              className={`rounded-md px-3 py-1 text-[10px] transition-colors ${
                (config.fps ?? 30) === f
                  ? "bg-primary text-white"
                  : "bg-surface-3 text-text-muted hover:bg-border"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Transition Duration (frames)">
        <input
          type="number"
          value={config.transitionDuration ?? 15}
          onChange={(e) =>
            updateGlobal({ transitionDuration: Number(e.target.value) })
          }
          min={0}
          max={60}
          className="input-field w-24"
        />
      </FieldGroup>

      <div className="border-t border-border pt-4 mt-4">
        <h3 className="text-[11px] font-semibold text-text mb-3 uppercase tracking-wider">
          Background Music
        </h3>

        <FieldGroup label="Music File">
          <AssetPicker
            value={config.backgroundMusic ?? ""}
            onChange={(v) => updateGlobal({ backgroundMusic: v || undefined })}
            accept="audio"
          />
        </FieldGroup>

        <FieldGroup label="Volume">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={config.backgroundMusicVolume ?? 0.15}
              onChange={(e) =>
                updateGlobal({
                  backgroundMusicVolume: Number(e.target.value),
                })
              }
              className="flex-1 accent-primary"
            />
            <span className="text-[10px] text-text-muted w-10 text-right">
              {Math.round((config.backgroundMusicVolume ?? 0.15) * 100)}%
            </span>
          </div>
        </FieldGroup>
      </div>

      <div className="border-t border-border pt-4 mt-4">
        <h3 className="text-[11px] font-semibold text-text mb-3 uppercase tracking-wider">
          HeyGen PiP Overlay
        </h3>

        <FieldGroup label="Avatar Video">
          <AssetPicker
            value={config.heygenVideo ?? ""}
            onChange={(v) => updateGlobal({ heygenVideo: v || undefined })}
            accept="video"
          />
        </FieldGroup>

        {config.heygenVideo && (
          <>
            <FieldGroup label="Position">
              <div className="grid grid-cols-2 gap-1.5">
                {PIP_POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateGlobal({ heygenPosition: pos })}
                    className={`rounded-md px-2 py-1 text-[10px] transition-colors ${
                      (config.heygenPosition ?? "bottomRight") === pos
                        ? "bg-primary text-white"
                        : "bg-surface-3 text-text-muted hover:bg-border"
                    }`}
                  >
                    {pos.replace(/([A-Z])/g, " $1").trim()}
                  </button>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup label="Size (px)">
              <input
                type="number"
                value={config.heygenSize ?? 220}
                onChange={(e) =>
                  updateGlobal({ heygenSize: Number(e.target.value) })
                }
                min={100}
                max={600}
                className="input-field w-24"
              />
            </FieldGroup>

            <FieldGroup label="Enter Frame">
              <input
                type="number"
                value={config.heygenEnterFrame ?? 0}
                onChange={(e) =>
                  updateGlobal({ heygenEnterFrame: Number(e.target.value) })
                }
                min={0}
                className="input-field w-24"
              />
            </FieldGroup>

            <FieldGroup label="Exit Frame">
              <input
                type="number"
                value={config.heygenExitFrame ?? 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateGlobal({
                    heygenExitFrame: val > 0 ? val : undefined,
                  });
                }}
                min={0}
                className="input-field w-24"
                placeholder="Auto"
              />
            </FieldGroup>

            <FieldGroup label="Volume">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.heygenVolume ?? 1}
                  onChange={(e) =>
                    updateGlobal({ heygenVolume: Number(e.target.value) })
                  }
                  className="flex-1 accent-primary"
                />
                <span className="text-[10px] text-text-muted w-10 text-right">
                  {Math.round((config.heygenVolume ?? 1) * 100)}%
                </span>
              </div>
            </FieldGroup>
          </>
        )}
      </div>
    </>
  );
}
