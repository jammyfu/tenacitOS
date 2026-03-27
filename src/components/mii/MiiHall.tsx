/**
 * MiiHall — roster view for customized characters and instance assignments
 */

"use client";

import React, { useMemo, useState } from "react";
import { Download, Edit3, Link, Trash2, Unlink, Upload } from "lucide-react";
import { MiiAvatar } from "./MiiAvatar";
import type { DockerInstance, MiiCharacter } from "@/lib/mii-types";
import { getCharacterBindings, getPrimaryBinding } from "@/lib/mii-utils";

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
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 38, fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
      <div
        style={{
          flex: 1,
          height: 5,
          borderRadius: 999,
          backgroundColor: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            backgroundColor: color,
          }}
        />
      </div>
      <span style={{ width: 24, fontSize: 11, textAlign: "right", color: "var(--text-secondary)" }}>
        {value}
      </span>
    </div>
  );
}

interface CharacterCardProps {
  character: MiiCharacter;
  dockerInstances: DockerInstance[];
  onEdit: (character: MiiCharacter) => void;
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
  const primaryBinding = getPrimaryBinding(character);
  const bindings = getCharacterBindings(character);
  const primaryInstance = dockerInstances.find(
    (instance) => instance.id === primaryBinding?.instanceId
  );
  const effectiveStatus =
    primaryInstance?.status === "running"
      ? "online"
      : primaryInstance?.status === "stopped"
        ? "offline"
        : character.status;

  return (
    <article
      style={{
        borderRadius: 22,
        overflow: "hidden",
        border: "1px solid var(--border)",
        background:
          "linear-gradient(180deg, rgba(245,158,11,0.10), transparent 28%), var(--card)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          padding: 20,
          borderBottom: "1px solid var(--border)",
          display: "grid",
          gridTemplateColumns: "96px 1fr",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at top, rgba(255,255,255,0.26), transparent 42%), var(--surface-elevated)",
            border: `2px solid ${STATUS_COLORS[effectiveStatus]}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MiiAvatar
            appearance={character.avatar}
            size={88}
            statusColor={STATUS_COLORS[effectiveStatus]}
          />
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {character.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                {character.role}
              </div>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                backgroundColor: `${STATUS_COLORS[effectiveStatus]}20`,
                color: STATUS_COLORS[effectiveStatus],
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: STATUS_COLORS[effectiveStatus],
                }}
              />
              {STATUS_LABELS[effectiveStatus]}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {character.personality.map((trait) => (
              <span
                key={trait}
                style={{
                  padding: "3px 8px",
                  borderRadius: 999,
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  backgroundColor: "var(--surface-elevated)",
                  border: "1px solid var(--border)",
                }}
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 18px", display: "grid", gap: 10 }}>
        <StatBar label="执行" value={character.stats.execution} color="#FF3B30" />
        <StatBar label="创造" value={character.stats.creativity} color="#BF5AF2" />
        <StatBar label="协调" value={character.stats.coordination} color="#0A84FF" />
        <StatBar label="专注" value={character.stats.focus} color="#32D74B" />
      </div>

      <div
        style={{
          padding: "0 18px 16px",
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            padding: 12,
            borderRadius: 14,
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface-elevated)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
            主实例
          </div>
          <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
            {primaryInstance
              ? `${primaryInstance.emoji || "🤖"} ${primaryInstance.name}`
              : "未绑定"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            {primaryInstance
              ? `${primaryBinding?.duty || "主控"} · ${primaryInstance.containerName || primaryInstance.id}`
              : "可在下方快速指定，详细职责在编辑器中维护。"}
          </div>
        </div>

        {bindings.filter((binding) => binding.mode !== "primary").length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {bindings
              .filter((binding) => binding.mode !== "primary")
              .map((binding) => {
                const instance = dockerInstances.find((item) => item.id === binding.instanceId);
                return (
                  <span
                    key={binding.instanceId}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--card)",
                      fontSize: 11,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {(instance?.emoji || "🤖") + " " + (instance?.name || binding.instanceId)} · {binding.duty}
                  </span>
                );
              })}
          </div>
        )}

        {character.description && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {character.description}
          </div>
        )}
      </div>

      <div
        style={{
          padding: 16,
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          position: "relative",
        }}
      >
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          绑定实例数: {bindings.length}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setShowBindMenu((open) => !open)} style={ghostButtonStyle}>
            {primaryInstance ? <Unlink size={13} /> : <Link size={13} />}
            {primaryInstance ? "改绑主实例" : "快速绑定"}
          </button>
          <button type="button" onClick={() => onEdit(character)} style={ghostButtonStyle}>
            <Edit3 size={13} />
            编辑
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`确认删除角色「${character.name}」？`)) onDelete(character.id);
            }}
            style={dangerButtonStyle}
          >
            <Trash2 size={13} />
            删除
          </button>
        </div>

        {showBindMenu && (
          <div
            style={{
              position: "absolute",
              right: 16,
              bottom: "calc(100% + 8px)",
              width: 240,
              borderRadius: 16,
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
              overflow: "hidden",
              zIndex: 20,
            }}
          >
            <div style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)" }}>
              选择这个角色的主控实例
            </div>
            {dockerInstances.map((instance) => (
              <button
                key={instance.id}
                type="button"
                onClick={() => {
                  onBindDocker(character.id, instance.id);
                  setShowBindMenu(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  border: "none",
                  backgroundColor:
                    primaryInstance?.id === instance.id ? "var(--accent-soft)" : "transparent",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>{instance.emoji || "🤖"}</span>
                <span style={{ flex: 1 }}>{instance.name}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{instance.status}</span>
              </button>
            ))}
            {primaryInstance && (
              <button
                type="button"
                onClick={() => {
                  onBindDocker(character.id, undefined);
                  setShowBindMenu(false);
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  borderTop: "1px solid var(--border)",
                  backgroundColor: "transparent",
                  color: "var(--negative)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                解除主实例绑定
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function InstanceRoster({
  dockerInstances,
  characters,
}: {
  dockerInstances: DockerInstance[];
  characters: MiiCharacter[];
}) {
  const characterMap = useMemo(
    () => new Map(characters.map((character) => [character.id, character])),
    [characters]
  );

  return (
    <section
      style={{
        marginTop: 22,
        borderRadius: 20,
        border: "1px solid var(--border)",
        backgroundColor: "var(--card)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
          openclaw 实例绑定看板
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
          检查每个 Docker/openclaw 实例当前由哪个角色主控。
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, padding: 16 }}>
        {dockerInstances.map((instance) => {
          const character = instance.assignedCharacterId
            ? characterMap.get(instance.assignedCharacterId)
            : characters.find(
                (item) => getPrimaryBinding(item)?.instanceId === instance.id
              );
          return (
            <div
              key={instance.id}
              style={{
                borderRadius: 16,
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface-elevated)",
                padding: 14,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{instance.emoji || "🤖"}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                    {instance.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {instance.runtime || "openclaw"} · {instance.status}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {instance.containerName || instance.composeService || instance.workspace || instance.id}
              </div>
              <div
                style={{
                  borderRadius: 12,
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  padding: 10,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              >
                {character ? (
                  <>
                    主控角色: <strong style={{ color: "var(--text-primary)" }}>{character.name}</strong>
                  </>
                ) : (
                  "当前未分配主控角色"
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface MiiHallProps {
  characters: MiiCharacter[];
  dockerInstances: DockerInstance[];
  onEdit: (character: MiiCharacter) => void;
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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const data = JSON.parse(loadEvent.target?.result as string);
        onImport(Array.isArray(data) ? data : [data]);
      } catch {
        alert("导入失败：JSON 文件格式无效");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  if (characters.length === 0) {
    return (
      <div
        style={{
          borderRadius: 24,
          border: "1px dashed var(--border)",
          padding: "72px 24px",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ fontSize: 58, marginBottom: 12 }}>🙂</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-secondary)" }}>
          还没有角色
        </div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          先创建一个 Mii 风格角色，再把它绑定到 openclaw Docker 实例。
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {characters.length} 个角色 · {characters.filter((item) => getPrimaryBinding(item)).length} 个已绑定主实例
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <label style={ghostButtonStyle}>
            <Upload size={13} />
            导入
            <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
          </label>
          <button type="button" onClick={handleExport} style={ghostButtonStyle}>
            <Download size={13} />
            导出
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 18,
        }}
      >
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            dockerInstances={dockerInstances}
            onEdit={onEdit}
            onDelete={onDelete}
            onBindDocker={onBindDocker}
          />
        ))}
      </div>

      {dockerInstances.length > 0 && (
        <InstanceRoster dockerInstances={dockerInstances} characters={characters} />
      )}
    </div>
  );
}

const ghostButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface-elevated)",
  color: "var(--text-secondary)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
};

const dangerButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid rgba(239,68,68,0.24)",
  backgroundColor: "rgba(239,68,68,0.10)",
  color: "#ef4444",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
};
