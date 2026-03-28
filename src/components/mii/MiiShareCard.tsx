/**
 * MiiShareCard — generates a PNG share card for a Mii character
 *
 * Draws everything onto an HTML Canvas (no external libraries) and
 * exports as PNG. The avatar SVG is embedded via a data-URL.
 */

"use client";

import React, { useCallback, useRef, useState } from "react";
import { X, Download, Share2 } from "lucide-react";
import { MiiAvatar } from "./MiiAvatar";
import type { MiiCharacter } from "@/lib/mii-types";
import { HAIR_COLOR_VALUES } from "@/lib/mii-types";

interface MiiShareCardProps {
  character: MiiCharacter;
  onClose: () => void;
}

const CARD_W = 420;
const CARD_H = 560;

// Map personality to pastel colors
const PERSONALITY_PILL_COLORS: Record<string, string> = {
  严肃: "#6366f1",
  活泼: "#f59e0b",
  冷静: "#06b6d4",
  热情: "#ef4444",
  谨慎: "#8b5cf6",
  大胆: "#f97316",
  友善: "#10b981",
  独立: "#3b82f6",
  协作: "#14b8a6",
  创意: "#ec4899",
  精准: "#64748b",
  领导力: "#e11d48",
  团队协作: "#0ea5e9",
};

const STAT_LABELS: Record<string, string> = {
  execution: "执行力",
  creativity: "创造力",
  coordination: "协调力",
  focus: "专注度",
  leadership: "领导力",
  adaptability: "适应力",
};

const STAT_COLORS: Record<string, string> = {
  execution: "#FF3B30",
  creativity: "#BF5AF2",
  coordination: "#0A84FF",
  focus: "#32D74B",
  leadership: "#FF9F0A",
  adaptability: "#30D158",
};

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function renderShareCard(
  character: MiiCharacter,
  avatarSvgEl: SVGSVGElement
): Promise<Blob> {
  // 1. Serialize the avatar SVG
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(avatarSvgEl);
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  const avatarImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = svgUrl;
  });

  URL.revokeObjectURL(svgUrl);

  // 2. Set up canvas
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;

  const hairHex =
    HAIR_COLOR_VALUES[character.avatar.hairColor] ?? "#3B82F6";

  // 3. Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bgGrad.addColorStop(0, "#0f172a");
  bgGrad.addColorStop(1, "#1e293b");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // 4. Accent top strip (hair color)
  const stripGrad = ctx.createLinearGradient(0, 0, CARD_W, 0);
  stripGrad.addColorStop(0, hairHex + "cc");
  stripGrad.addColorStop(1, hairHex + "44");
  ctx.fillStyle = stripGrad;
  ctx.fillRect(0, 0, CARD_W, 6);

  // 5. Avatar circle background
  const cx = CARD_W / 2;
  const avatarY = 36;
  const avatarSize = 130;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, avatarY + avatarSize / 2, avatarSize / 2 + 8, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fill();
  ctx.restore();

  // 6. Draw avatar image centered
  ctx.drawImage(
    avatarImg,
    cx - avatarSize / 2,
    avatarY,
    avatarSize,
    avatarSize
  );

  // 7. Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(character.name, cx, avatarY + avatarSize + 32);

  // 8. Role badge
  const roleText = character.role;
  ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const roleMeasure = ctx.measureText(roleText);
  const rolePillW = roleMeasure.width + 28;
  const rolePillH = 26;
  const rolePillX = cx - rolePillW / 2;
  const rolePillY = avatarY + avatarSize + 40;

  drawRoundRect(ctx, rolePillX, rolePillY, rolePillW, rolePillH, 13);
  ctx.fillStyle = hairHex + "33";
  ctx.fill();
  ctx.strokeStyle = hairHex + "88";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = hairHex;
  ctx.textAlign = "center";
  ctx.fillText(roleText, cx, rolePillY + 17);

  // 9. Personality tags
  const tagY = rolePillY + rolePillH + 18;
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const tagGap = 8;
  const tags = character.personality;
  const tagWidths = tags.map((t) => ctx.measureText(t).width + 20);
  const totalTagW = tagWidths.reduce((a, b) => a + b, 0) + tagGap * (tags.length - 1);
  let tagX = cx - totalTagW / 2;

  for (let i = 0; i < tags.length; i++) {
    const tw = tagWidths[i];
    const color = PERSONALITY_PILL_COLORS[tags[i]] ?? "#6366f1";
    drawRoundRect(ctx, tagX, tagY, tw, 22, 11);
    ctx.fillStyle = color + "33";
    ctx.fill();
    ctx.strokeStyle = color + "88";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(tags[i], tagX + tw / 2, tagY + 15);
    tagX += tw + tagGap;
  }

  // 10. Divider
  const divY = tagY + 34;
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, divY);
  ctx.lineTo(CARD_W - 24, divY);
  ctx.stroke();

  // 11. Stats section
  const statsY = divY + 18;
  const statsRecord = character.stats as unknown as Record<string, number>;
  const statKeys = Object.keys(statsRecord).filter(
    (k) => typeof statsRecord[k] === "number"
  );

  const barW = CARD_W - 80;
  const barH = 5;
  const barGap = 24;

  for (let i = 0; i < statKeys.length; i++) {
    const key = statKeys[i];
    const value = statsRecord[key] ?? 0;
    const color = STAT_COLORS[key] ?? "#6366f1";
    const label = STAT_LABELS[key] ?? key;
    const sy = statsY + i * barGap;

    // Label
    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(label, 32, sy + 9);

    // Track
    drawRoundRect(ctx, 88, sy + 2, barW - 30, barH, 3);
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fill();

    // Fill
    const fillW = Math.max(4, ((barW - 30) * value) / 100);
    drawRoundRect(ctx, 88, sy + 2, fillW, barH, 3);
    ctx.fillStyle = color;
    ctx.fill();

    // Value
    ctx.textAlign = "right";
    ctx.fillStyle = color;
    ctx.fillText(String(value), CARD_W - 20, sy + 9);
  }

  // 12. Description (if any)
  if (character.description) {
    const descY = statsY + statKeys.length * barGap + 14;
    ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    const maxW = CARD_W - 60;
    // Naive word wrap
    const words = character.description.split("");
    let line = "";
    let lineY = descY;
    for (const char of words) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxW && line) {
        ctx.fillText(line, cx, lineY);
        line = char;
        lineY += 17;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, cx, lineY);
  }

  // 13. Footer watermark
  ctx.font = "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  ctx.fillText("tenacitOS · Mii 角色系统", cx, CARD_H - 16);

  // 14. Export as blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("canvas.toBlob failed"));
      },
      "image/png"
    );
  });
}

export function MiiShareCard({ character, onClose }: MiiShareCardProps) {
  const avatarRef = useRef<SVGSVGElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!avatarRef.current) return;
    setExporting(true);
    try {
      const blob = await renderShareCard(character, avatarRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mii-${character.name.replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [character]);

  const hairHex = HAIR_COLOR_VALUES[character.avatar.hairColor] ?? "#3B82F6";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.75)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 480,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Share2 size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              分享角色卡片
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        <div style={{ padding: 20 }}>
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              background: "linear-gradient(180deg, #0f172a, #1e293b)",
              padding: 24,
              position: "relative",
            }}
          >
            {/* Accent strip */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(90deg, ${hairHex}cc, ${hairHex}44)`,
              }}
            />

            {/* Avatar */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MiiAvatar
                  ref={avatarRef}
                  appearance={character.avatar}
                  size={110}
                />
              </div>
            </div>

            {/* Name */}
            <div
              style={{
                textAlign: "center",
                fontSize: 22,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 8,
              }}
            >
              {character.name}
            </div>

            {/* Role */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <span
                style={{
                  padding: "4px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  backgroundColor: hairHex + "22",
                  border: `1px solid ${hairHex}66`,
                  color: hairHex,
                }}
              >
                {character.role}
              </span>
            </div>

            {/* Personality tags */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 6,
                marginBottom: 16,
              }}
            >
              {character.personality.map((trait) => {
                const color = PERSONALITY_PILL_COLORS[trait] ?? "#6366f1";
                return (
                  <span
                    key={trait}
                    style={{
                      padding: "3px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      backgroundColor: color + "22",
                      border: `1px solid ${color}66`,
                      color,
                    }}
                  >
                    {trait}
                  </span>
                );
              })}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(Object.entries(character.stats as unknown as Record<string, number>)).map(([key, value]) => {
                const color = STAT_COLORS[key] ?? "#6366f1";
                const label = STAT_LABELS[key] ?? key;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 42, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                      {label}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 999,
                        backgroundColor: "rgba(255,255,255,0.10)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${value}%`,
                          height: "100%",
                          backgroundColor: color,
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                    <span style={{ width: 24, textAlign: "right", fontSize: 10, color }}>
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: 16,
                textAlign: "center",
                fontSize: 10,
                color: "rgba(255,255,255,0.2)",
              }}
            >
              tenacitOS · Mii 角色系统
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: "0 20px 20px",
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            关闭
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={exporting}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              backgroundColor: "var(--accent)",
              color: "#fff",
              cursor: exporting ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              opacity: exporting ? 0.7 : 1,
            }}
          >
            <Download size={14} />
            {exporting ? "生成中…" : "下载 PNG"}
          </button>
        </div>
      </div>
    </div>
  );
}
