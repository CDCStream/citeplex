"use client";

import type { TextOverlayConfig } from "@remotion/components/ScreenRecordingPlayer";
import { Plus, Trash2 } from "lucide-react";

interface TextOverlayEditorProps {
  overlays: TextOverlayConfig[];
  onChange: (overlays: TextOverlayConfig[]) => void;
  label?: string;
}

export function TextOverlayEditor({
  overlays,
  onChange,
  label = "Text Overlays",
}: TextOverlayEditorProps) {
  const addOverlay = () => {
    const lastFrame =
      overlays.length > 0
        ? overlays[overlays.length - 1].frame + overlays[overlays.length - 1].duration + 10
        : 0;
    onChange([
      ...overlays,
      { text: "New text", frame: lastFrame, duration: 60, position: "top", fontSize: 34 },
    ]);
  };

  const updateOverlay = (index: number, patch: Partial<TextOverlayConfig>) => {
    const updated = overlays.map((o, i) =>
      i === index ? { ...o, ...patch } : o
    );
    onChange(updated);
  };

  const removeOverlay = (index: number) => {
    onChange(overlays.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
          {label}
        </label>
        <button
          onClick={addOverlay}
          className="flex items-center gap-1 text-[10px] text-primary hover:text-primary-hover"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      {overlays.length === 0 ? (
        <p className="text-[10px] text-text-muted italic">No text overlays</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {overlays.map((overlay, i) => (
            <div
              key={i}
              className="rounded-md bg-surface-2 px-2 py-2 text-[10px] space-y-1.5"
            >
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={overlay.text}
                  onChange={(e) => updateOverlay(i, { text: e.target.value })}
                  className="input-field-sm flex-1"
                  placeholder="Text..."
                />
                <button
                  onClick={() => removeOverlay(i)}
                  className="rounded p-0.5 hover:bg-danger/20 shrink-0"
                >
                  <Trash2 className="h-3 w-3 text-danger" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">Frame</span>
                  <input
                    type="number"
                    value={overlay.frame}
                    onChange={(e) =>
                      updateOverlay(i, { frame: Number(e.target.value) })
                    }
                    className="input-field-sm w-14"
                    min={0}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">Dur</span>
                  <input
                    type="number"
                    value={overlay.duration}
                    onChange={(e) =>
                      updateOverlay(i, { duration: Number(e.target.value) })
                    }
                    className="input-field-sm w-14"
                    min={1}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">Size</span>
                  <input
                    type="number"
                    value={overlay.fontSize ?? 34}
                    onChange={(e) =>
                      updateOverlay(i, { fontSize: Number(e.target.value) })
                    }
                    className="input-field-sm w-12"
                    min={8}
                    max={120}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-text-muted">Pos</span>
                {(["top", "center", "bottom"] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateOverlay(i, { position: pos })}
                    className={`rounded px-2 py-0.5 capitalize transition-colors ${
                      (overlay.position ?? "top") === pos
                        ? "bg-primary text-white"
                        : "bg-surface-3 text-text-muted hover:bg-border"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
