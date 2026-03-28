/**
 * /mii — Mii Character System dashboard page
 *
 * Combines the MiiHall gallery with the MiiEditor modal,
 * and displays a quick stats header bar.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Smile } from "lucide-react";
import { MiiHall } from "@/components/mii/MiiHall";
import { MiiEditor } from "@/components/mii/MiiEditor";
import { useDockerInstances } from "@/hooks/useDockerInstances";
import type { MiiCharacter } from "@/lib/mii-types";
import { getPrimaryBinding, setPrimaryInstance } from "@/lib/mii-utils";

export default function MiiPage() {
  const [characters, setCharacters] = useState<MiiCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCharacter, setEditingCharacter] = useState<MiiCharacter | null>(null);
  const [isCreating, setIsCreating] = useState(false);
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

  const showEditor = isCreating || editingCharacter !== null;

  // ── Stats summary ─────────────────────────────────────────────────────────
  const onlineCount = characters.filter((c) => {
    const primaryInstanceId = getPrimaryBinding(c)?.instanceId;
    const inst = instances.find((i) => i.id === primaryInstanceId);
    return inst?.status === "running" || (c.status === "online" && !primaryInstanceId);
  }).length;

  const boundCount = characters.filter(
    (character) => getPrimaryBinding(character)?.instanceId
  ).length;

  return (
    <div style={{ padding: "24px" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
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
            marginBottom: 6,
          }}
        >
          <Smile style={{ color: "var(--accent)" }} size={28} />
          Mii 角色系统
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          管理你的 AI 代理角色 · {characters.length} 个角色 · {onlineCount} 在线
          {!instancesLoading && instances.length > 0 && (
            <> · {instances.length} 个 Docker 实例</>
          )}
        </p>
      </div>

      {/* ── Summary cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
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

      {/* ── Create button ── */}
      {!showEditor && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setIsCreating(true)}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              backgroundColor: "var(--accent)",
              color: "#FFF",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Plus size={18} /> 新建角色
          </button>
        </div>
      )}

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
      ) : (
        <MiiHall
          characters={characters}
          dockerInstances={instances}
          onEdit={(c) => setEditingCharacter(c)}
          onDelete={handleDelete}
          onBindDocker={handleBindDocker}
          onImport={handleImport}
        />
      )}
    </div>
  );
}
