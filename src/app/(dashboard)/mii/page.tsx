/**
 * /mii — Mii Character System dashboard page
 *
 * Combines the MiiHall gallery with the MiiEditor modal,
 * a top toolbar, summary stats, and quick status filter tabs.
 */

"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { Download, Plus, Smile, Swords, Upload, Users, Joystick } from "lucide-react";
import { MiiHall } from "@/components/mii/MiiHall";
import { MiiEditor } from "@/components/mii/MiiEditor";
import { useDockerInstances } from "@/hooks/useDockerInstances";
import type { MiiCharacter } from "@/lib/mii-types";
import { getPrimaryBinding, setPrimaryInstance } from "@/lib/mii-utils";

type StatusFilter = "all" | "online" | "offline" | "unbound";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "全部",
  online: "在线",
  offline: "离线",
  unbound: "未绑定",
};

export default function MiiPage() {
  const [characters, setCharacters] = useState<MiiCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCharacter, setEditingCharacter] = useState<MiiCharacter | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const importInputRef = useRef<HTMLInputElement>(null);
  const { instances, loading: instancesLoading } = useDockerInstances();

  // ── Fetch characters ──────────────────────────────────────────────────────
  const fetchCharacters = useCallback(async () => {
    try {
      const res = await fetch("/api/mii");
      const data = await res.json();
      setCharacters(data.characters ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async (character: MiiCharacter) => {
    const method = characters.some((c) => c.id === character.id) ? "PUT" : "POST";
    await fetch("/api/mii", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(character),
    });
    setEditingCharacter(null);
    setIsCreating(false);
    fetchCharacters();
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    await fetch(`/api/mii?id=${id}`, { method: "DELETE" });
    fetchCharacters();
  };

  // ── Docker bind ───────────────────────────────────────────────────────────
  const handleBindDocker = async (
    characterId: string,
    instanceId: string | undefined
  ) => {
    const character = characters.find((c) => c.id === characterId);
    if (!character) return;
    await fetch("/api/mii", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setPrimaryInstance(character, instanceId)),
    });
    fetchCharacters();
  };

  // ── Import ────────────────────────────────────────────────────────────────
  const handleImport = async (imported: MiiCharacter[]) => {
    for (const c of imported) {
      await fetch("/api/mii", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
    }
    fetchCharacters();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        handleImport(Array.isArray(data) ? data : [data]);
      } catch {
        alert("导入失败：JSON 文件格式无效");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Export ────────────────────────────────────────────────────────────────
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

  // ── Reorder ───────────────────────────────────────────────────────────────
  const handleReorder = useCallback(async (orderedIds: string[]) => {
    const reorder = orderedIds.map((id, index) => ({ id, order: index }));
    await fetch("/api/mii", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reorder }),
    });
  }, []);

  const showEditor = isCreating || editingCharacter !== null;

  // ── Stats summary ─────────────────────────────────────────────────────────
  const onlineCount = useMemo(() =>
    characters.filter((c) => {
      const primaryInstanceId = getPrimaryBinding(c)?.instanceId;
      const inst = instances.find((i) => i.id === primaryInstanceId);
      return inst?.status === "running" || (c.status === "online" && !primaryInstanceId);
    }).length,
    [characters, instances]
  );

  const offlineCount = useMemo(() =>
    characters.filter((c) => {
      const primaryInstanceId = getPrimaryBinding(c)?.instanceId;
      const inst = instances.find((i) => i.id === primaryInstanceId);
      if (inst) return inst.status !== "running";
      return c.status === "offline";
    }).length,
    [characters, instances]
  );

  const boundCount = useMemo(() =>
    characters.filter((c) => getPrimaryBinding(c)?.instanceId).length,
    [characters]
  );

  const unboundCount = characters.length - boundCount;

  // ── Filter characters ─────────────────────────────────────────────────────
  const filteredCharacters = useMemo(() => {
    switch (statusFilter) {
      case "online":
        return characters.filter((c) => {
          const primaryInstanceId = getPrimaryBinding(c)?.instanceId;
          const inst = instances.find((i) => i.id === primaryInstanceId);
          return inst?.status === "running" || (c.status === "online" && !primaryInstanceId);
        });
      case "offline":
        return characters.filter((c) => {
          const primaryInstanceId = getPrimaryBinding(c)?.instanceId;
          const inst = instances.find((i) => i.id === primaryInstanceId);
          if (inst) return inst.status !== "running";
          return c.status === "offline";
        });
      case "unbound":
        return characters.filter((c) => !getPrimaryBinding(c)?.instanceId);
      default:
        return characters;
    }
  }, [characters, instances, statusFilter]);

  const filterCounts: Record<StatusFilter, number> = {
    all: characters.length,
    online: onlineCount,
    offline: offlineCount,
    unbound: unboundCount,
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "var(--font-heading)",
              letterSpacing: "-1px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <Smile style={{ color: "var(--accent)" }} size={28} />
            Mii 角色系统
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            管理你的 AI 代理角色
            {!instancesLoading && instances.length > 0 && (
              <> · {instances.length} 个 Docker 实例</>
            )}
          </p>
        </div>

        {/* ── Toolbar ── */}
        {!showEditor && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/mii/arcade" style={{ ...toolbarSecondaryStyle, textDecoration: "none" }}>
              <Joystick size={14} />
              Arcade 指挥舱
            </Link>
            <Link href="/mii/battle" style={{ ...toolbarSecondaryStyle, textDecoration: "none" }}>
              <Swords size={14} />
              对战模拟
            </Link>
            <Link href="/mii/team" style={{ ...toolbarSecondaryStyle, textDecoration: "none" }}>
              <Users size={14} />
              团队视图
            </Link>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              style={toolbarSecondaryStyle}
            >
              <Upload size={14} />
              导入 JSON
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              style={{ display: "none" }}
            />
            <button type="button" onClick={handleExport} style={toolbarSecondaryStyle}>
              <Download size={14} />
              导出 JSON
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              style={toolbarPrimaryStyle}
            >
              <Plus size={16} />
              新建角色
            </button>
          </div>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: "总角色数", value: characters.length, color: "var(--info)" },
          { label: "在线", value: onlineCount, color: "var(--positive)" },
          { label: "已绑定主实例", value: boundCount, color: "var(--warning)" },
          { label: "实例池", value: instances.length, color: "var(--accent)" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "14px 18px",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Quick filter tabs ── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          padding: "4px",
          backgroundColor: "var(--surface-elevated)",
          borderRadius: 12,
          border: "1px solid var(--border)",
          width: "fit-content",
        }}
      >
        {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              backgroundColor: statusFilter === key ? "var(--accent)" : "transparent",
              color: statusFilter === key ? "#fff" : "var(--text-secondary)",
              fontWeight: statusFilter === key ? 700 : 400,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "background-color 0.15s",
            }}
          >
            {FILTER_LABELS[key]}
            <span
              style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 999,
                backgroundColor: statusFilter === key ? "rgba(255,255,255,0.25)" : "var(--border)",
                color: statusFilter === key ? "#fff" : "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              {filterCounts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Editor modal ── */}
      {showEditor && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreating(false);
              setEditingCharacter(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              width: "100%",
              maxWidth: 820,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px 24px 80px",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 20,
                fontFamily: "var(--font-heading)",
              }}
            >
              {editingCharacter ? `编辑角色 · ${editingCharacter.name}` : "新建角色"}
            </div>
            <MiiEditor
              initial={editingCharacter ?? undefined}
              dockerInstances={instances}
              onSave={handleSave}
              onCancel={() => {
                setIsCreating(false);
                setEditingCharacter(null);
              }}
            />
          </div>
        </div>
      )}

      {/* ── Hall ── */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "60px 0",
            color: "var(--text-muted)",
          }}
        >
          加载中...
        </div>
      ) : characters.length === 0 ? (
        /* Empty state — no characters at all */
        <div
          style={{
            borderRadius: 24,
            border: "1px dashed var(--border)",
            padding: "72px 24px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🙂</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>
            还没有角色
          </div>
          <div style={{ fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            创建你的第一个 Mii 风格角色，赋予 AI 代理独特的个性与外观。<br />
            角色可以绑定 openclaw Docker 实例，实时反映运行状态。
          </div>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            style={toolbarPrimaryStyle}
          >
            <Plus size={16} />
            创建第一个角色
          </button>
        </div>
      ) : filteredCharacters.length === 0 ? (
        /* Empty state — filter has no results */
        <div
          style={{
            borderRadius: 24,
            border: "1px dashed var(--border)",
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ fontSize: 42, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
            「{FILTER_LABELS[statusFilter]}」筛选下没有角色
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            style={{ ...toolbarSecondaryStyle, marginTop: 12 }}
          >
            显示全部角色
          </button>
        </div>
      ) : (
        <MiiHall
          characters={filteredCharacters}
          dockerInstances={instances}
          onEdit={(c) => setEditingCharacter(c)}
          onDelete={handleDelete}
          onBindDocker={handleBindDocker}
          onImport={handleImport}
          onReorder={handleReorder}
        />
      )}
    </div>
  );
}

const toolbarPrimaryStyle: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  backgroundColor: "var(--accent)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const toolbarSecondaryStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface-elevated)",
  color: "var(--text-secondary)",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};
