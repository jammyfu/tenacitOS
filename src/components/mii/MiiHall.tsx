/**
 * MiiHall — Character gallery / Mii Channel-style display
 *
 * Renders all saved characters in a grid, with live status dots,
 * stat bars, and quick action buttons (edit, bind Docker, delete).
 */

"use client";

import React, { useState } from "react";
import { MiiAvatar } from "./MiiAvatar";
import type { MiiCharacter, DockerInstance } from "@/lib/mii-types";
import { Edit3, Trash2, Link, Unlink, Download, Upload } from "lucide-react";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<MiiCharacter["status"], string> = {
  online: "#32D74B",
  busy: "#FFD60A",
  idle: "#0A84FF",
  offline: "#525252",
};

const STATUS_LABELS: Record<MiiCharacter["status"], string> = {
  online: "在线",
  busy: "繁忙",
  idle: "待机",
  offline: "离线",
};

// ─── Stat bar ─────────────────────────────────────────────────────────────────

function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 36, fontSize: 10, color: "var(--text-muted)" }}>{label}</span>
      <div
        style={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          backgroundColor: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      </div>
      <span style={{ width: 22, fontSize: 10, color: "var(--text-secondary)", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

// ─── Character Card ───────────────────────────────────────────────────────────

interface CharacterCardProps {
  character: MiiCharacter;
  dockerInstances: DockerInstance[];
  onEdit: (c: MiiCharacter) => void;
  onDelete: (id: string) => void;
  onBindDocker: (id: string, instanceId: string | undefined) => void;
}

function CharacterCard({
  character,
  dockerInstances,
  onEdit,
  onDelete,
  onBindDocker,
}: CharacterCardProps) {
  const [showBindMenu, setShowBindMenu] = useState(false);
  const statusColor = STATUS_COLORS[character.status];
  const boundInstance = dockerInstances.find(
    (d) => d.id === character.dockerInstanceId
  );

  // Determine effective status from Docker instance if bound
  const effectiveStatus =
    boundInstance?.status === "running"
      ? "online"
      : boundInstance?.status === "stopped"
      ? "offline"
      : character.status;

  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
        transition: "transform 0.15s, box-shadow 0.15s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Header with avatar */}
      <div
        style={{
          background: `linear-gradient(135deg, ${statusColor}18, var(--surface))`,
          padding: "20px 20px 12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid var(--border)",
          position: "relative",
        }}
      >
        {/* Catchphrase speech bubble */}
        {character.catchphrase && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              right: 10,
              backgroundColor: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "5px 10px",
              fontSize: 11,
              color: "var(--text-secondary)",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            「{character.catchphrase}」
          </div>
        )}

        {/* Avatar */}
        <div
          style={{
            backgroundColor: "var(--surface-elevated)",
            borderRadius: "50%",
            padding: 6,
            border: `2px solid ${statusColor}50`,
            marginTop: character.catchphrase ? 28 : 0,
          }}
        >
          <MiiAvatar
            appearance={character.avatar}
            size={80}
            statusColor={STATUS_COLORS[effectiveStatus]}
          />
        </div>

        {/* Name + role */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {character.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {character.role}
          </div>
        </div>

        {/* Status badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 10px",
            borderRadius: "999px",
            backgroundColor: `${STATUS_COLORS[effectiveStatus]}20`,
            border: `1px solid ${STATUS_COLORS[effectiveStatus]}40`,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: STATUS_COLORS[effectiveStatus],
            }}
          />
          <span style={{ fontSize: 11, color: STATUS_COLORS[effectiveStatus], fontWeight: 600 }}>
            {STATUS_LABELS[effectiveStatus]}
          </span>
        </div>

        {/* Personality tags */}
        {character.personality.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
            {character.personality.map((p) => (
              <span
                key={p}
                style={{
                  fontSize: 10,
                  padding: "2px 7px",
                  borderRadius: "999px",
                  backgroundColor: "var(--surface-elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 5 }}>
        <StatBar label="执行" value={character.stats.execution} color="#FF3B30" />
        <StatBar label="创造" value={character.stats.creativity} color="#BF5AF2" />
        <StatBar label="协调" value={character.stats.coordination} color="#0A84FF" />
        <StatBar label="专注" value={character.stats.focus} color="#32D74B" />
      </div>

      {/* Docker binding */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          position: "relative",
        }}
      >
        <div style={{ flex: 1, fontSize: 11, color: "var(--text-muted)" }}>
          {boundInstance ? (
            <span style={{ color: "var(--text-secondary)" }}>
              绑定: <span style={{ color: "var(--accent)", fontWeight: 600 }}>{boundInstance.emoji} {boundInstance.name}</span>
            </span>
          ) : (
            <span>未绑定实例</span>
          )}
        </div>
        <button
          onClick={() => setShowBindMenu((b) => !b)}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface-elevated)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
          }}
        >
          {boundInstance ? <Unlink size={12} /> : <Link size={12} />}
          {boundInstance ? "解绑" : "绑定"}
        </button>

        {/* Bind dropdown */}
        {showBindMenu && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              right: 0,
              zIndex: 50,
              backgroundColor: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 8,
              minWidth: 160,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                padding: "4px 8px",
                marginBottom: 4,
              }}
            >
              选择实例
            </div>
            {dockerInstances.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "4px 8px" }}>
                暂无实例
              </div>
            )}
            {dockerInstances.map((inst) => (
              <button
                key={inst.id}
                onClick={() => {
                  onBindDocker(character.id, inst.id);
                  setShowBindMenu(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor:
                    inst.id === character.dockerInstanceId
                      ? "var(--accent-soft)"
                      : "transparent",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                <span>{inst.emoji || "🤖"}</span>
                <span>{inst.name}</span>
                <span
                  style={{
                    marginLeft: "auto",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor:
                      inst.status === "running"
                        ? "#32D74B"
                        : inst.status === "stopped"
                        ? "#525252"
                        : "#FFD60A",
                  }}
                />
              </button>
            ))}
            {character.dockerInstanceId && (
              <button
                onClick={() => {
                  onBindDocker(character.id, undefined);
                  setShowBindMenu(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "transparent",
                  color: "var(--negative)",
                  cursor: "pointer",
                  fontSize: 12,
                  marginTop: 4,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <Unlink size={12} /> 解除绑定
              </button>
            )}
          </div>
        )}
      </div>

      {/* Description (if exists) */}
      {character.description && (
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}
        >
          {character.description.slice(0, 80)}
          {character.description.length > 80 ? "..." : ""}
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          padding: "8px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={() => onEdit(character)}
          style={{
            padding: "5px 12px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface-elevated)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
          }}
        >
          <Edit3 size={12} /> 编辑
        </button>
        <button
          onClick={() => {
            if (confirm(`确认删除角色「${character.name}」？`)) {
              onDelete(character.id);
            }
          }}
          style={{
            padding: "5px 12px",
            borderRadius: 6,
            border: "1px solid var(--negative)30",
            backgroundColor: "var(--negative-soft)",
            color: "var(--negative)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
          }}
        >
          <Trash2 size={12} /> 删除
        </button>
      </div>
    </div>
  );
}

// ─── Hall Component ───────────────────────────────────────────────────────────

interface MiiHallProps {
  characters: MiiCharacter[];
  dockerInstances: DockerInstance[];
  onEdit: (c: MiiCharacter) => void;
  onDelete: (id: string) => void;
  onBindDocker: (id: string, instanceId: string | undefined) => void;
  onImport: (characters: MiiCharacter[]) => void;
}

export function MiiHall({
  characters,
  dockerInstances,
  onEdit,
  onDelete,
  onBindDocker,
  onImport,
}: MiiHallProps) {
  const handleExport = () => {
    const json = JSON.stringify(characters, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mii-characters.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        const arr = Array.isArray(data) ? data : [data];
        onImport(arr as MiiCharacter[]);
      } catch {
        alert("导入失败：无效的 JSON 文件");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (characters.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "80px 24px",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ fontSize: 64 }}>👥</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-secondary)" }}>
          还没有角色
        </div>
        <div style={{ fontSize: 14 }}>点击「新建角色」开始创建你的第一个 Mii 角色</div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {characters.length} 个角色 · {characters.filter((c) => c.status === "online").length} 在线
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <label
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
            }}
          >
            <Upload size={13} /> 导入
            <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
          </label>
          <button
            onClick={handleExport}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
            }}
          >
            <Download size={13} /> 导出
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {characters.map((c) => (
          <CharacterCard
            key={c.id}
            character={c}
            dockerInstances={dockerInstances}
            onEdit={onEdit}
            onDelete={onDelete}
            onBindDocker={onBindDocker}
          />
        ))}
      </div>
    </div>
  );
}
