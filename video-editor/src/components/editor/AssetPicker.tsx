"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Folder, X } from "lucide-react";

interface AssetPickerProps {
  value: string;
  onChange: (value: string) => void;
  accept: "video" | "audio";
}

interface AssetFile {
  name: string;
  path: string;
  size: number;
}

export function AssetPicker({ value, onChange, accept }: AssetPickerProps) {
  const [assets, setAssets] = useState<AssetFile[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch(`/api/assets?type=${accept}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.files ?? []);
      }
    } catch {}
  }, [accept]);

  useEffect(() => {
    if (showPicker) fetchAssets();
  }, [showPicker, fetchAssets]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/assets", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        onChange(data.path);
        fetchAssets();
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const acceptMime = accept === "video" ? "video/*" : "audio/*";
  const displayValue = value ? value.split("/").pop() : "";

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field flex-1 text-[11px]"
          placeholder={`marketing/${accept === "video" ? "demo.mp4" : "bg-music.mp3"}`}
        />
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="shrink-0 rounded-md p-1.5 bg-surface-3 hover:bg-border text-text-muted transition-colors"
          title="Browse assets"
        >
          <Folder className="h-3.5 w-3.5" />
        </button>
      </div>

      {showPicker && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-surface-2 shadow-xl max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-[10px] font-medium text-text-muted uppercase">
              Assets
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1 text-[10px] text-primary hover:text-primary-hover"
              >
                <Upload className="h-3 w-3" />
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => setShowPicker(false)}
                className="rounded p-0.5 hover:bg-surface-3"
              >
                <X className="h-3 w-3 text-text-muted" />
              </button>
            </div>
          </div>

          {assets.length === 0 ? (
            <p className="px-3 py-4 text-[10px] text-text-muted text-center">
              No {accept} files found in marketing/
            </p>
          ) : (
            assets.map((asset) => (
              <button
                key={asset.path}
                onClick={() => {
                  onChange(asset.path);
                  setShowPicker(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-[11px] hover:bg-surface-3 transition-colors ${
                  value === asset.path ? "text-primary" : "text-text"
                }`}
              >
                <span className="truncate">{asset.name}</span>
                <span className="text-[9px] text-text-muted shrink-0 ml-2">
                  {formatSize(asset.size)}
                </span>
              </button>
            ))
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptMime}
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
