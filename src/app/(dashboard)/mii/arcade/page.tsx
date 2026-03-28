/**
 * /mii/arcade — Arcade Mini Command Deck
 *
 * A deep-dark command-center view of all Mii characters
 * arranged on "workstations" grouped by role.
 * Connects to ws://127.0.0.1:18789 for real-time status.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Radio, Wifi, WifiOff } from "lucide-react";
import { MiiAvatar } from "@/components/mii/MiiAvatar";
import { useDockerInstances } from "@/hooks/useDockerInstances";
import type { DockerInstance, MiiCharacter } from "@/lib/mii-types";
import { HAIR_COLOR_VALUES } from "@/lib/mii-types";
import { getPrimaryBinding } from "@/lib/mii-utils";

// ─── Role meta ──────────────────────────────────────────────────────────────

const ROLE_ICONS: Record<string, string> = {
  工程师: "🔧",
  指挥官: "🎯",
  侦察员: "👁",
  守卫: "🛡",
  设计师: "🎨",
  分析师: "📊",
  探索者: "🚀",
  协调员: "🔗",
  研究员: "🔬",
  测试员: "🧪",
  部署员: "🚢",
};

const ROLE_ZONE_COLORS: Record<string, string> = {
  工程师: "#3b82f6",
  指挥官: "#ef4444",
  侦察员: "#06b6d4",
  守卫: "#f59e0b",
  设计师: "#ec4899",
  分析师: "#8b5cf6",
  探索者: "#10b981",
  协调员: "#14b8a6",
  研究员: "#6366f1",
  测试员: "#f97316",
  部署员: "#64748b",
};

// ─── Station component ───────────────────────────────────────────────────────

function Workstation({
  character,
  instance,
  zoneColor,
}: {
  character: MiiCharacter;
  instance: DockerInstance | undefined;
  zoneColor: string;
}) {
  const isRunning = instance?.status === "running";
  const isError = instance?.status === "error";
  const statusColor = isRunning ? "#32D74B" : isError ? "#FF453A" : "#525252";
  const hairHex = HAIR_COLOR_VALUES[character.avatar.hairColor] ?? zoneColor;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        position: "relative",
        padding: "12px 8px 10px",
        borderRadius: 14,
        border: `1px solid ${zoneColor}33`,
        backgroundColor: isRunning
          ? `${zoneColor}0e`
          : "rgba(255,255,255,0.03)",
        minWidth: 80,
        transition: "background-color 0.3s",
      }}
    >
      {/* Status breathing ring */}
      {isRunning && (
        <div
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: 14,
            border: `1px solid ${statusColor}88`,
            animation: "breathe 2s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Avatar */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: `2px solid ${statusColor}66`,
          background: `radial-gradient(circle at top, ${hairHex}22, transparent)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <MiiAvatar appearance={character.avatar} size={42} />
        {/* Status dot */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: statusColor,
            border: "2px solid #0a0f1a",
          }}
        />
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.75)",
          fontWeight: 600,
          textAlign: "center",
          maxWidth: 72,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {character.name}
      </div>

      {/* Instance label */}
      <div
        style={{
          fontSize: 9,
          color: isRunning ? statusColor : "rgba(255,255,255,0.25)",
          textAlign: "center",
          maxWidth: 72,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {instance
          ? `${instance.emoji ?? ""} ${instance.name}`.trim()
          : "未绑定"}
      </div>
    </div>
  );
}

// ─── Zone (role group) ───────────────────────────────────────────────────────

function RoleZone({
  role,
  characters,
  instances,
}: {
  role: string;
  characters: MiiCharacter[];
  instances: DockerInstance[];
}) {
  const zoneColor = ROLE_ZONE_COLORS[role] ?? "#6366f1";
  const icon = ROLE_ICONS[role] ?? "🤖";
  const activeCount = characters.filter((c) => {
    const primaryId = getPrimaryBinding(c)?.instanceId;
    const inst = instances.find((i) => i.id === primaryId);
    return inst?.status === "running";
  }).length;

  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${zoneColor}33`,
        backgroundColor: "rgba(255,255,255,0.02)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Zone header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingBottom: 10,
          borderBottom: `1px solid ${zoneColor}22`,
        }}
      >
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: zoneColor,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {role}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: activeCount > 0 ? "#32D74B" : "rgba(255,255,255,0.25)",
            fontWeight: 600,
          }}
        >
          {activeCount}/{characters.length} 在线
        </span>
      </div>

      {/* Workstations grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {characters.map((c) => {
          const primaryId = getPrimaryBinding(c)?.instanceId;
          const inst = instances.find((i) => i.id === primaryId);
          return (
            <Workstation
              key={c.id}
              character={c}
              instance={inst}
              zoneColor={zoneColor}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ArcadePage() {
  const [characters, setCharacters] = useState<MiiCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [clock, setClock] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const { instances } = useDockerInstances(5_000);

  // Fetch characters
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
    const interval = setInterval(fetchCharacters, 15_000);
    return () => clearInterval(interval);
  }, [fetchCharacters]);

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // WebSocket
  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket("ws://127.0.0.1:18789");
      ws.onopen = () => { wsRef.current = ws; setWsConnected(true); };
      ws.onclose = () => { setWsConnected(false); };
      ws.onerror = () => { setWsConnected(false); };
    } catch {
      // WS not available
    }
    return () => { ws?.close(); };
  }, []);

  // Group by role
  const grouped = React.useMemo(() => {
    const map = new Map<string, MiiCharacter[]>();
    for (const c of characters) {
      if (!map.has(c.role)) map.set(c.role, []);
      map.get(c.role)!.push(c);
    }
    return map;
  }, [characters]);

  const totalOnline = React.useMemo(
    () =>
      characters.filter((c) => {
        const primaryId = getPrimaryBinding(c)?.instanceId;
        const inst = instances.find((i) => i.id === primaryId);
        return inst?.status === "running";
      }).length,
    [characters, instances]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050d1a",
        color: "#e2e8f0",
        fontFamily: "'Courier New', monospace",
        backgroundImage:
          "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        padding: 24,
      }}
    >
      {/* Breathing animation keyframes */}
      <style>{`
        @keyframes breathe {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
      `}</style>

      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          padding: "12px 16px",
          borderRadius: 14,
          border: "1px solid rgba(59,130,246,0.2)",
          backgroundColor: "rgba(59,130,246,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link
            href="/mii"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              fontSize: 12,
            }}
          >
            <ArrowLeft size={14} />
            返回 Mii 系统
          </Link>
          <div
            style={{
              width: 1,
              height: 16,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Radio size={14} style={{ color: "#3b82f6" }} />
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#e2e8f0",
                letterSpacing: 2,
              }}
            >
              ARCADE — COMMAND DECK
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Online count */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#32D74B",
                animation: totalOnline > 0 ? "breathe 2s infinite" : "none",
              }}
            />
            <span style={{ fontSize: 12, color: "#32D74B", fontWeight: 600 }}>
              {totalOnline} ONLINE
            </span>
          </div>

          {/* WS indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            {wsConnected ? (
              <Wifi size={12} style={{ color: "#32D74B" }} />
            ) : (
              <WifiOff size={12} style={{ color: "#525252" }} />
            )}
            <span style={{ color: wsConnected ? "#32D74B" : "#525252" }}>
              WS
            </span>
          </div>

          {/* Clock */}
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#3b82f6",
              letterSpacing: 2,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {clock}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "60px 0",
            color: "rgba(255,255,255,0.3)",
            fontSize: 13,
            letterSpacing: 2,
          }}
        >
          LOADING…
        </div>
      ) : characters.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          <div style={{ fontSize: 42, marginBottom: 12 }}>🏢</div>
          <div style={{ fontSize: 14, letterSpacing: 2 }}>指挥舱空置 — 请先创建角色</div>
          <Link
            href="/mii"
            style={{
              display: "inline-block",
              marginTop: 16,
              color: "#3b82f6",
              fontSize: 12,
            }}
          >
            前往 Mii 系统创建角色 →
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 18,
          }}
        >
          {Array.from(grouped.entries()).map(([role, chars]) => (
            <RoleZone
              key={role}
              role={role}
              characters={chars}
              instances={instances}
            />
          ))}
        </div>
      )}

      {/* Footer scan line decoration */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: "1px solid rgba(59,130,246,0.15)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "rgba(255,255,255,0.18)",
          letterSpacing: 2,
        }}
      >
        <span>TENACITOS · MII ARCADE v1.0</span>
        <span>{characters.length} UNITS · {grouped.size} ZONES</span>
      </div>
    </div>
  );
}
