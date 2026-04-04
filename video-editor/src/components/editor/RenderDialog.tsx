"use client";

import { useEditorStore } from "@/store/editor-store";
import { X, Download, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

interface RenderDialogProps {
  open: boolean;
  onClose: () => void;
  downloadUrl: string | null;
}

export function RenderDialog({ open, onClose, downloadUrl }: RenderDialogProps) {
  const isRendering = useEditorStore((s) => s.isRendering);
  const renderProgress = useEditorStore((s) => s.renderProgress);
  const renderLogs = useEditorStore((s) => s.renderLogs);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [renderLogs]);

  if (!open) return null;

  const progressPct = Math.round(renderProgress * 100);
  const isDone = !isRendering && renderProgress >= 1;
  const hasError = renderLogs.some((l) => l.startsWith("Error:") || l.startsWith("Render failed"));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            {isRendering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Rendering Video...
              </>
            ) : isDone && !hasError ? (
              <>
                <CheckCircle className="h-4 w-4 text-success" />
                Render Complete
              </>
            ) : hasError ? (
              <>
                <AlertCircle className="h-4 w-4 text-danger" />
                Render Failed
              </>
            ) : (
              "Render"
            )}
          </h2>
          <button
            onClick={onClose}
            disabled={isRendering}
            className="rounded-md p-1 text-text-muted hover:bg-surface-2 transition-colors disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 py-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Progress</span>
              <span className="font-mono">{progressPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  hasError ? "bg-danger" : isDone ? "bg-success" : "bg-primary"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Logs */}
          <div className="rounded-lg bg-bg border border-border p-3 max-h-56 overflow-y-auto font-mono text-[10px] leading-relaxed text-text-muted space-y-0.5">
            {renderLogs.length === 0 ? (
              <span className="italic">Waiting for output...</span>
            ) : (
              renderLogs.map((log, i) => (
                <div
                  key={i}
                  className={
                    log.startsWith("Error") || log.startsWith("Render failed")
                      ? "text-danger"
                      : log.includes("Render complete")
                      ? "text-success font-semibold"
                      : ""
                  }
                >
                  {log}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          {isDone && !hasError && downloadUrl && (
            <a
              href={downloadUrl}
              download
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-hover transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download Video
            </a>
          )}
          <button
            onClick={onClose}
            disabled={isRendering}
            className="rounded-md border border-border px-4 py-1.5 text-xs text-text-muted hover:bg-surface-2 transition-colors disabled:opacity-30"
          >
            {isDone ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
