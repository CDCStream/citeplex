import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const TEXT_DURATION = 65;
const SCREEN_START = 70;

const DAYS_OF_WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

type ArticleType = "how-to" | "listicle" | "comparison" | "guide" | "explainer" | "round-up";

interface CalendarEntry {
  day: number;
  type: ArticleType;
  title: string;
  vol: string;
  kd: string;
  hasWrite?: boolean;
}

const TYPE_COLORS: Record<ArticleType, string> = {
  "how-to": "#f97316",
  listicle: "#22c55e",
  comparison: "#8b5cf6",
  guide: "#3b82f6",
  explainer: "#eab308",
  "round-up": "#ef4444",
};

const TYPE_BG: Record<ArticleType, string> = {
  "how-to": "#fff7ed",
  listicle: "#f0fdf4",
  comparison: "#f5f3ff",
  guide: "#eff6ff",
  explainer: "#fefce8",
  "round-up": "#fef2f2",
};

const ENTRIES: CalendarEntry[] = [
  { day: 1, type: "how-to", title: "how to find low competition keywords", vol: "900", kd: "8" },
  { day: 2, type: "listicle", title: "content marketing tools", vol: "2,100", kd: "7" },
  { day: 3, type: "listicle", title: "best seo software for agencies", vol: "1,900", kd: "9" },
  { day: 4, type: "how-to", title: "how to find low competition keywords", vol: "900", kd: "10" },
  { day: 5, type: "listicle", title: "social media competitor analysis tool", vol: "320", kd: "15" },
  { day: 6, type: "how-to", title: "how to do keyword research for ecommerce", vol: "200", kd: "1" },
  { day: 7, type: "comparison", title: "rank tracking software for agencies", vol: "480", kd: "10" },
  { day: 8, type: "how-to", title: "how to increase organic traffic to website", vol: "390", kd: "19" },
  { day: 9, type: "guide", title: "how to increase domain authority", vol: "700", kd: "21" },
  { day: 10, type: "comparison", title: "keyword difficulty checker free", vol: "1,300", kd: "9" },
  { day: 11, type: "listicle", title: "website authority checker", vol: "1,100", kd: "6" },
  { day: 12, type: "listicle", title: "website traffic estimator free", vol: "300", kd: "5" },
  { day: 13, type: "guide", title: "seo dashboard", vol: "3,600", kd: "14" },
  { day: 14, type: "guide", title: "digital marketing analytics", vol: "1,200", kd: "7" },
  { day: 15, type: "explainer", title: "what is ai search optimization", vol: "180", kd: "" },
  { day: 16, type: "how-to", title: "how to optimize for ai search results", vol: "40", kd: "" },
  { day: 17, type: "comparison", title: "enterprise seo platform comparison", vol: "300", kd: "3" },
  { day: 18, type: "comparison", title: "digital marketing analytics dashboard", vol: "390", kd: "4" },
  { day: 19, type: "listicle", title: "ppc competitor analysis tool", vol: "590", kd: "14" },
  { day: 20, type: "how-to", title: "how to do keyword research for content marke...", vol: "200", kd: "5" },
  { day: 21, type: "guide", title: "ai overview optimization strategy", vol: "", kd: "" },
  { day: 22, type: "round-up", title: "AI search statistics 2025", vol: "", kd: "" },
  { day: 23, type: "listicle", title: "best SEO tools for marketers 2025", vol: "", kd: "" },
  { day: 24, type: "round-up", title: "SEO industry benchmark report", vol: "", kd: "" },
  { day: 25, type: "listicle", title: "seo reporting software for agencies", vol: "", kd: "" },
  { day: 26, type: "how-to", title: "how to increase organic search traffic fast", vol: "", kd: "" },
  { day: 27, type: "explainer", title: "what is organic search traffic", vol: "100", kd: "15" },
  { day: 28, type: "how-to", title: "how to identify keyword cannibalization issues", vol: "", kd: "" },
  { day: 29, type: "comparison", title: "seo platform with ai recommendations", vol: "", kd: "" },
  { day: 30, type: "how-to", title: "how to measure seo roi for clients", vol: "", kd: "" },
];

const FIRST_DAY_OFFSET = 2; // April 2026 starts on Wednesday (index 2)

export const Calendar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textEnter = spring({ frame: frame - 5, fps, config: { damping: 14, mass: 0.7 } });
  const textOpacity = interpolate(textEnter, [0, 1], [0, 1]);
  const textY = interpolate(textEnter, [0, 1], [80, 0]);
  const textFadeOut = interpolate(frame, [TEXT_DURATION - 12, TEXT_DURATION], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const screenVisible = frame >= SCREEN_START;
  const screenEnter = spring({ frame: frame - SCREEN_START - 5, fps, config: { damping: 14, mass: 0.8 } });
  const screenOpacity = interpolate(screenEnter, [0, 1], [0, 1]);
  const screenRotateY = interpolate(screenEnter, [0, 1], [10, 2]);
  const screenRotateX = interpolate(screenEnter, [0, 1], [5, 1]);
  const screenScale = interpolate(screenEnter, [0, 1], [0.9, 1.35]);

  const totalCells = 35; // 5 weeks x 7 days
  const CELL_ANIM_START = SCREEN_START + 20;
  const CELL_INTERVAL = 2;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Phase 1: Text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          opacity: Math.min(textOpacity, textFadeOut),
          transform: `translateY(${textY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            fontFamily: "Inter, sans-serif",
            color: "#ffffff",
            letterSpacing: -2,
            textAlign: "center",
            maxWidth: 1100,
            lineHeight: 1.15,
          }}
        >
          Auto-Schedule{" "}
          <span style={{ color: "#a855f7" }}>Articles</span>{" "}
          per Month
        </div>
      </div>

      {/* Phase 2: Calendar */}
      {screenVisible && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            perspective: 1200,
            opacity: screenOpacity,
          }}
        >
          <div
            style={{
              transform: `rotateY(${screenRotateY}deg) rotateX(${screenRotateX}deg) scale(${screenScale})`,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 0 80px rgba(168,85,247,0.25), 0 20px 60px rgba(0,0,0,0.5)",
              border: "1px solid rgba(168,85,247,0.2)",
              width: 1300,
            }}
          >
            {/* Browser chrome */}
            <div
              style={{
                background: "linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
              </div>
              <div
                style={{
                  flex: 1,
                  marginLeft: 12,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 6,
                  padding: "5px 14px",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                citeplex.io/dashboard/content
              </div>
            </div>

            {/* Calendar content */}
            <div style={{ background: "#ffffff", padding: "24px 28px" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", fontFamily: "Inter, sans-serif" }}>
                    April 2026
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", fontFamily: "Inter, sans-serif", marginTop: 2 }}>
                    30 articles planned this month
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#9ca3af" }}>{"<"}</div>
                  <div style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#9ca3af" }}>{">"}</div>
                </div>
              </div>

              {/* Day headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: 1 }}>
                {DAYS_OF_WEEK.map((d) => (
                  <div
                    key={d}
                    style={{
                      textAlign: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#9ca3af",
                      fontFamily: "Inter, sans-serif",
                      padding: "6px 0",
                      letterSpacing: 1,
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
                {Array.from({ length: totalCells }, (_, cellIdx) => {
                  const dayNum = cellIdx - FIRST_DAY_OFFSET + 1;
                  const isValidDay = dayNum >= 1 && dayNum <= 30;
                  const entry = isValidDay ? ENTRIES.find((e) => e.day === dayNum) : undefined;

                  const cellAnimFrame = CELL_ANIM_START + cellIdx * CELL_INTERVAL;
                  const cellProgress = entry
                    ? spring({ frame: frame - cellAnimFrame, fps, config: { damping: 12, mass: 0.5 } })
                    : 1;
                  const cellScale = entry ? interpolate(cellProgress, [0, 1], [0.3, 1]) : 1;
                  const cellOpacity = isValidDay ? (entry ? interpolate(cellProgress, [0, 1], [0, 1]) : 0.4) : 0;

                  return (
                    <div
                      key={cellIdx}
                      style={{
                        minHeight: 80,
                        border: "1px solid #f3f4f6",
                        borderRadius: 6,
                        padding: "4px 6px",
                        background: isValidDay ? "#fff" : "transparent",
                        position: "relative",
                      }}
                    >
                      {isValidDay && (
                        <div style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", fontFamily: "Inter, sans-serif", marginBottom: 3 }}>
                          {dayNum}
                        </div>
                      )}
                      {entry && (
                        <div
                          style={{
                            opacity: cellOpacity,
                            transform: `scale(${cellScale})`,
                            transformOrigin: "top left",
                          }}
                        >
                          <div
                            style={{
                              background: TYPE_BG[entry.type],
                              borderRadius: 5,
                              padding: "4px 6px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLORS[entry.type] }} />
                              <span style={{ fontSize: 8, fontWeight: 700, color: TYPE_COLORS[entry.type], fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>
                                {entry.type}
                              </span>
                            </div>
                            <div style={{ fontSize: 8, fontWeight: 500, color: "#374151", fontFamily: "Inter, sans-serif", lineHeight: 1.3, marginBottom: 2, overflow: "hidden", maxHeight: 22 }}>
                              {entry.title}
                            </div>
                            {(entry.vol || entry.kd) && (
                              <div style={{ fontSize: 7, color: "#9ca3af", fontFamily: "Inter, sans-serif" }}>
                                {entry.vol && <span>{entry.vol} vol</span>}
                                {entry.vol && entry.kd && <span> · </span>}
                                {entry.kd && <span>KD:{entry.kd}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                {(Object.keys(TYPE_COLORS) as ArticleType[]).map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLORS[t] }} />
                    <span style={{ fontSize: 8, color: "#6b7280", fontFamily: "Inter, sans-serif", textTransform: "capitalize" }}>
                      {t.replace("-", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
