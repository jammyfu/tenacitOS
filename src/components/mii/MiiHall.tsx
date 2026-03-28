/**
 * MiiHall — roster view for customized characters and instance assignments
 */

"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Download, Edit3, GripVertical, Link, Trash2, Unlink, Upload } from "lucide-react";
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
  isDragOver?: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: () => void;
}

function CharacterCard({
  character,
  dockerInstances,
  onEdit,
  onDelete,
  onBindDocker,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
}: CharacterCardProps) {
  const [showBindMenu, setShowBindMenu] = useState(false);
  const avatarRef = useRef<SVGSVGElement>(null);
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

  // dot/border color driven by docker instance status for precise signal
  const instanceDotColor =
    primaryInstance?.status === "running"
      ? "#32D74B"
      : primaryInstance?.status === "error"
        ? "#FF453A"
        : primaryInstance?.status === "stopped"
          ? "#525252"
          : primaryInstance?.status === "unknown"
            ? "#888"
            : STATUS_COLORS[effectiveStatus];

  // label shown in status badge — override for docker error
  const statusLabel =
    primaryInstance?.status === "error"
      ? "异常"
      : STATUS_LABELS[effectiveStatus];

  return (
    <article
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(character.id); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver(character.id); }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      onDragEnd={() => onDrop()}
      style={{
        borderRadius: 22,
        overflow: "hidden",
        border: isDragOver ? "2px solid var(--accent)" : "1px solid var(--border)",
        background:
          "linear-gradient(180deg, rgba(245,158,11,0.10), transparent 28%), var(--card)",
        boxShadow: isDragOver
          ? "0 0 0 2px var(--accent), 0 12px 30px rgba(0,0,0,0.28)"
          : "0 12px 30px rgba(0,0,0,0.18)",
        cursor: "grab",
        transition: "box-shadow 0.15s, border-color 0.15s",
        opacity: isDragOver ? 0.85 : 1,
      }}
    >
      <div
        style={{
          padding: 20,
          borderBottom: "1px solid var(--border)",
          display: "grid",
          gridTemplateColumns: "16px 96px 1fr",
          gap: 12,
          alignItems: "center",
        }}
      >
        <GripVertical size={14} style={{ color: "var(--text-muted)", opacity: 0.5, flexShrink: 0 }} />
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at top, rgba(255,255,255,0.26), transparent 42%), var(--surface-elevated)",
            border: `2px solid ${instanceDotColor}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MiiAvatar
            ref={avatarRef}
            appearance={character.avatar}
            size={88}
            statusColor={instanceDotColor}
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
                backgroundColor: `${instanceDotColor}20`,
                color: instanceDotColor,
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
                  backgroundColor: instanceDotColor,
                }}
              />
              {statusLabel}
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

        {character.catchphrase && (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              backgroundColor: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "6px 12px",
              fontStyle: "italic",
              position: "relative",
            }}
          >
            💬 {character.catchphrase}
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
          <button
            type="button"
            title="导出 SVG"
            onClick={() => {
              if (!avatarRef.current) return;
              const svgEl = avatarRef.current;
              const serializer = new XMLSerializer();
              const svgStr = serializer.serializeToString(svgEl);
              const blob = new Blob([svgStr], { type: "image/svg+xml" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `mii-${character.name.replace(/\s+/g, "-")}.svg`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={ghostButtonStyle}
          >
            <Download size={13} />
            SVG
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
  onReorder: (orderedIds: string[]) => void;
}

export function MiiHall({
  characters,
  dockerInstances,
  onEdit,
  onDelete,
  onBindDocker,
  onImport,
  onReorder,
}: MiiHallProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [groupByRole, setGroupByRole] = useState(false);
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Maintain a local ordering for optimistic reorder
  const [orderedIds, setOrderedIds] = useState<string[] | null>(null);

  const displayCharacters = useMemo(() => {
    if (!orderedIds) return characters;
    const map = new Map(characters.map((c) => [c.id, c]));
    return orderedIds.map((id) => map.get(id)).filter(Boolean) as MiiCharacter[];
  }, [characters, orderedIds]);

  const handleDragStart = useCallback((id: string) => {
    setDragSourceId(id);
  }, []);

  const handleDragOver = useCallback((id: string) => {
    if (id !== dragSourceId) setDragOverId(id);
  }, [dragSourceId]);

  const handleDrop = useCallback(() => {
    if (!dragSourceId || !dragOverId || dragSourceId === dragOverId) {
      setDragSourceId(null);
      setDragOverId(null);
      return;
    }
    const base = orderedIds ?? characters.map((c) => c.id);
    const from = base.indexOf(dragSourceId);
    const to = base.indexOf(dragOverId);
    if (from === -1 || to === -1) {
      setDragSourceId(null);
      setDragOverId(null);
      return;
    }
    const next = [...base];
    next.splice(from, 1);
    next.splice(to, 0, dragSourceId);
    setOrderedIds(next);
    onReorder(next);
    setDragSourceId(null);
    setDragOverId(null);
  }, [dragSourceId, dragOverId, orderedIds, characters, onReorder]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return displayCharacters;
    return displayCharacters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.personality.some((p) => p.toLowerCase().includes(q)) ||
        (c.description?.toLowerCase().includes(q) ?? false)
    );
  }, [displayCharacters, searchQuery]);

  const grouped = useMemo(() => {
    if (!groupByRole) return null;
    const map = new Map<string, MiiCharacter[]>();
    for (const c of filtered) {
      const key = c.role;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [filtered, groupByRole]);

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
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {filtered.length}/{characters.length} 个角色 · {characters.filter((item) => getPrimaryBinding(item)).length} 个已绑定主实例 · 拖拽卡片可排序
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            placeholder="搜索角色名/职责/性格…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text-primary)",
              fontSize: 12,
              width: 200,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => setGroupByRole((v) => !v)}
            style={{
              ...ghostButtonStyle,
              backgroundColor: groupByRole ? "var(--accent)" : "var(--surface-elevated)",
              color: groupByRole ? "#fff" : "var(--text-secondary)",
              borderColor: groupByRole ? "var(--accent)" : "var(--border)",
            }}
          >
            按职责分组
          </button>
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

      {filtered.length === 0 && searchQuery && (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "48px 0", fontSize: 13 }}>
          没有匹配「{searchQuery}」的角色
        </div>
      )}

      {grouped
        ? Array.from(grouped.entries()).map(([role, group]) => (
            <div key={role} style={{ marginBottom: 28 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "var(--text-muted)",
                  marginBottom: 12,
                  paddingLeft: 4,
                }}
              >
                {role} ({group.length})
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: 18,
                }}
              >
                {group.map((character) => (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    dockerInstances={dockerInstances}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onBindDocker={onBindDocker}
                    isDragOver={dragOverId === character.id}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            </div>
          ))
        : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 18,
            }}
          >
            {filtered.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                dockerInstances={dockerInstances}
                onEdit={onEdit}
                onDelete={onDelete}
                onBindDocker={onBindDocker}
                isDragOver={dragOverId === character.id}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )
      }

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
