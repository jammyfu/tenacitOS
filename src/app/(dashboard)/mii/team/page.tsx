/**
 * /mii/team — Team View
 *
 * Displays all characters as a team:
 * - Team radar chart (average stats across all members)
 * - Member cards with individual stats
 * - Team summary statistics
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { MiiAvatar } from "@/components/mii/MiiAvatar";
import { MiiRadarChart } from "@/components/mii/MiiRadarChart";
import type { MiiCharacter, MiiStats } from "@/lib/mii-types";
import { PERSONALITY_COLORS, ROLE_ICONS } from "@/lib/mii-types";

const STAT_KEYS: (keyof MiiStats)[] = [
  "execution",
  "creativity",
  "coordination",
  "focus",
  "leadership",
  "adaptability",
];
const STAT_LABELS: Record<keyof MiiStats, string> = {
  execution: "执行力",
  creativity: "创意力",
  coordination: "协调力",
  focus: "专注力",
  leadership: "领导力",
  adaptability: "适应力",
};

function averageStats(characters: MiiCharacter[]): MiiStats {
  if (characters.length === 0) {
    return { execution: 0, creativity: 0, coordination: 0, focus: 0, leadership: 0, adaptability: 0 };
  }
  const totals = STAT_KEYS.reduce((acc, key) => {
    acc[key] = characters.reduce((sum, c) => sum + (c.stats[key] ?? 0), 0);
    return acc;
  }, {} as Record<keyof MiiStats, number>);
  return STAT_KEYS.reduce((acc, key) => {
    acc[key] = Math.round(totals[key] / characters.length);
    return acc;
  }, {} as MiiStats);
}

function getTopRole(characters: MiiCharacter[]): string {
  const counts = characters.reduce((acc, c) => {
    acc[c.role] = (acc[c.role] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}

function getTeamRating(avgStats: MiiStats): { label: string; color: string } {
  const total = Object.values(avgStats).reduce((s, v) => s + v, 0);
  const avg = total / 6;
  if (avg >= 85) return { label: "精英团队 S+", color: "#FFD60A" };
  if (avg >= 75) return { label: "优秀团队 A", color: "#32D74B" };
  if (avg >= 60) return { label: "标准团队 B", color: "#0A84FF" };
  if (avg >= 45) return { label: "成长团队 C", color: "#FF9F0A" };
  return { label: "新生团队 D", color: "#FF453A" };
}

export default function TeamPage() {
  const [characters, setCharacters] = useState<MiiCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mii")
      .then((r) => r.json())
      .then((d) => setCharacters(d.characters ?? []))
      .finally(() => setLoading(false));
  }, []);

  const avgStats = useMemo(() => averageStats(characters), [characters]);
  const topRole = useMemo(() => getTopRole(characters), [characters]);
  const teamRating = useMemo(() => getTeamRating(avgStats), [avgStats]);
  const topStat = useMemo(() => {
    const top = (Object.entries(avgStats) as [keyof MiiStats, number][]).sort((a, b) => b[1] - a[1])[0];
    return top ? STAT_LABELS[top[0]] : "—";
  }, [avgStats]);

  const onlineCount = characters.filter((c) => c.status === "online").length;
  const roleDistribution = useMemo(() => {
    return characters.reduce((acc, c) => {
      acc[c.role] = (acc[c.role] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [characters]);

  if (loading) {
    return (
      <div style={{ padding: 24, color: "var(--text-muted)", textAlign: "center", paddingTop: 80 }}>
        加载中…
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/mii" style={backLinkStyle}>
          <ArrowLeft size={14} /> 返回角色大厅
        </Link>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 12,
            marginBottom: 4,
          }}
        >
          <Users style={{ color: "var(--accent)" }} size={26} />
          团队视图
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {characters.length} 名成员的综合能力分析
        </p>
      </div>

      {characters.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "72px 24px",
            color: "var(--text-muted)",
            border: "1px dashed var(--border)",
            borderRadius: 20,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-secondary)" }}>
            还没有团队成员
          </div>
          <Link href="/mii" style={{ ...btnPrimary, display: "inline-flex", marginTop: 20, textDecoration: "none" }}>
            去创建角色
          </Link>
        </div>
      ) : (
        <>
          {/* Team overview: radar + summary cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* Team Radar */}
            <div
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                团队综合雷达图
              </div>
              <MiiRadarChart stats={avgStats} accentColor="#6366f1" size={200} showLabels />
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: teamRating.color,
                  padding: "4px 14px",
                  borderRadius: 999,
                  backgroundColor: teamRating.color + "22",
                  border: `1px solid ${teamRating.color}55`,
                }}
              >
                {teamRating.label}
              </div>
            </div>

            {/* Summary grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Stat numbers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                }}
              >
                {STAT_KEYS.map((key) => {
                  const value = avgStats[key];
                  const color =
                    value >= 80 ? "#32D74B" : value >= 60 ? "#0A84FF" : value >= 40 ? "#FF9F0A" : "#FF453A";
                  return (
                    <div
                      key={key}
                      style={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        padding: "12px 14px",
                      }}
                    >
                      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {STAT_LABELS[key]}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          height: 4,
                          borderRadius: 999,
                          backgroundColor: "var(--border)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${value}%`,
                            backgroundColor: color,
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Team stats summary */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 10,
                }}
              >
                {[
                  { label: "总成员", value: characters.length, color: "var(--accent)" },
                  { label: "在线", value: onlineCount, color: "var(--positive)" },
                  { label: "主要职责", value: `${ROLE_ICONS[topRole as keyof typeof ROLE_ICONS] ?? ""} ${topRole}`, color: "var(--warning)" },
                  { label: "顶级能力", value: topStat, color: "var(--info)" },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 14,
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Role distribution */}
              <div
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "12px 14px",
                  flexGrow: 1,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                  职责分布
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(roleDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([role, count]) => (
                      <div
                        key={role}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "3px 10px",
                          borderRadius: 999,
                          backgroundColor: "var(--surface-elevated)",
                          border: "1px solid var(--border)",
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {ROLE_ICONS[role as keyof typeof ROLE_ICONS]} {role}
                        <span
                          style={{
                            fontWeight: 700,
                            color: "var(--accent)",
                            marginLeft: 2,
                          }}
                        >
                          ×{count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Member cards grid */}
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
            团队成员 ({characters.length})
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {characters.map((char) => (
              <MemberCard key={char.id} character={char} teamAvg={avgStats} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MemberCard({
  character,
  teamAvg,
}: {
  character: MiiCharacter;
  teamAvg: MiiStats;
}) {
  const totalStats = Object.values(character.stats).reduce((s, v) => s + v, 0);
  const teamTotal = Object.values(teamAvg).reduce((s, v) => s + v, 0);
  const isAboveAvg = totalStats > teamTotal;
  const statusColors: Record<string, string> = {
    online: "#32D74B",
    busy: "#FFD60A",
    idle: "#0A84FF",
    offline: "#525252",
  };

  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <MiiAvatar appearance={character.avatar} size={52} />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: statusColors[character.status] ?? "#525252",
              border: "2px solid var(--card)",
            }}
          />
        </div>
        <div>
          <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>
            {character.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {ROLE_ICONS[character.role]} {character.role}
          </div>
        </div>
      </div>

      {/* Personality pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {character.personality.map((p) => {
          const color = PERSONALITY_COLORS[p] ?? "#6366f1";
          return (
            <span
              key={p}
              style={{
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 999,
                backgroundColor: color + "22",
                border: `1px solid ${color}44`,
                color,
              }}
            >
              {p}
            </span>
          );
        })}
      </div>

      {/* Mini radar */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <MiiRadarChart
          stats={character.stats}
          accentColor="#6366f1"
          size={120}
          showLabels={false}
        />
      </div>

      {/* vs team average */}
      <div
        style={{
          textAlign: "center",
          fontSize: 11,
          color: isAboveAvg ? "#32D74B" : "var(--text-muted)",
          fontWeight: 600,
        }}
      >
        {isAboveAvg ? "↑ 高于团队均值" : totalStats === teamTotal ? "= 等于团队均值" : "↓ 低于团队均值"}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const backLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  color: "var(--text-secondary)",
  textDecoration: "none",
  padding: "6px 0",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 24px",
  borderRadius: 12,
  border: "none",
  backgroundColor: "var(--accent)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};
