"use client";

import type { ZoomKeyframe } from "@video/components/ZoomEffect";
import { Plus, Trash2 } from "lucide-react";

interface ZoomEditorProps {
  keyframes: ZoomKeyframe[];
  onChange: (keyframes: ZoomKeyframe[]) => void;
}

export function ZoomEditor({ keyframes, onChange }: ZoomEditorProps) {
  const addKeyframe = () => {
    const lastFrame =
      keyframes.length > 0 ? keyframes[keyframes.length - 1].frame + 60 : 30;
    onChange([
      ...keyframes,
      { frame: lastFrame, x: 960, y: 540, scale: 2, easeIn: 15, hold: 40, easeOut: 15 },
    ]);
  };

  const updateKeyframe = (index: number, patch: Partial<ZoomKeyframe>) => {
    const updated = keyframes.map((kf, i) =>
      i === index ? { ...kf, ...patch } : kf
    );
    onChange(updated);
  };

  const removeKeyframe = (index: number) => {
    onChange(keyframes.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
          Zoom Keyframes
        </label>
        <button
          onClick={addKeyframe}
          className="flex items-center gap-1 text-[10px] text-primary hover:text-primary-hover"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      {keyframes.length === 0 ? (
        <p className="text-[10px] text-text-muted italic">No zoom keyframes</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {keyframes.map((kf, i) => (
            <div
              key={i}
              className="rounded-md bg-surface-2 px-2 py-2 text-[10px] space-y-1.5"
            >
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-text-muted w-6">Frame</span>
                  <input
                    type="number"
                    value={kf.frame}
                    onChange={(e) =>
                      updateKeyframe(i, { frame: Number(e.target.value) })
                    }
                    className="input-field-sm w-14"
                    min={0}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">X</span>
                  <input
                    type="number"
                    value={kf.x}
                    onChange={(e) =>
                      updateKeyframe(i, { x: Number(e.target.value) })
                    }
                    className="input-field-sm w-14"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">Y</span>
                  <input
                    type="number"
                    value={kf.y}
                    onChange={(e) =>
                      updateKeyframe(i, { y: Number(e.target.value) })
                    }
                    className="input-field-sm w-14"
                  />
                </div>
                <button
                  onClick={() => removeKeyframe(i)}
                  className="ml-auto rounded p-0.5 hover:bg-danger/20"
                >
                  <Trash2 className="h-3 w-3 text-danger" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-text-muted w-6">Scale</span>
                  <input
                    type="number"
                    value={kf.scale}
                    onChange={(e) =>
                      updateKeyframe(i, { scale: Number(e.target.value) })
                    }
                    className="input-field-sm w-14"
                    min={1}
                    max={5}
                    step={0.1}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">In</span>
                  <input
                    type="number"
                    value={kf.easeIn ?? 15}
                    onChange={(e) =>
                      updateKeyframe(i, { easeIn: Number(e.target.value) })
                    }
                    className="input-field-sm w-10"
                    min={1}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">Hold</span>
                  <input
                    type="number"
                    value={kf.hold ?? 40}
                    onChange={(e) =>
                      updateKeyframe(i, { hold: Number(e.target.value) })
                    }
                    className="input-field-sm w-10"
                    min={0}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">Out</span>
                  <input
                    type="number"
                    value={kf.easeOut ?? 15}
                    onChange={(e) =>
                      updateKeyframe(i, { easeOut: Number(e.target.value) })
                    }
                    className="input-field-sm w-10"
                    min={1}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
