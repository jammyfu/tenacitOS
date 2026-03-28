/**
 * /mii/battle — Character Battle Simulation
 *
 * Select two Mii characters and simulate a task duel based on their stats.
 * Round-by-round text combat log with winner declaration.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Swords, RefreshCw, Trophy, Shield } from "lucide-react";
import { MiiAvatar } from "@/components/mii/MiiAvatar";
import type { MiiCharacter, MiiStats } from "@/lib/mii-types";
import { ROLE_ICONS } from "@/lib/mii-types";

// ── Battle logic ─────────────────────────────────────────────────────────────

interface BattleLog {
  round: number;
  attacker: string;
  defender: string;
  action: string;
  attackerHp: number;
  defenderHp: number;
  damage: number;
}

interface BattleResult {
  winner: MiiCharacter;
  loser: MiiCharacter;
  logs: BattleLog[];
  totalRounds: number;
}

const ROUND_ACTIONS = [
  (a: string, d: string, dmg: number) =>
    `⚡ ${a} 发动【闪电执行】，对 ${d} 造成 ${dmg} 点伤害！`,
  (a: string, d: string, dmg: number) =>
    `🎯 ${a} 精准命中 ${d} 的弱点，造成 ${dmg} 点暴击伤害！`,
  (a: string, d: string, dmg: number) =>
    `🔥 ${a} 调用创意算法，绕过 ${d} 的防御，造成 ${dmg} 点伤害。`,
  (a: string, d: string, dmg: number) =>
    `💻 ${a} 提交了一段优化代码，${d} 系统崩溃，损失 ${dmg} 点。`,
  (a: string, d: string, dmg: number) =>
    `🌀 ${a} 发起协调攻势，${d} 措手不及，受到 ${dmg} 点协调伤害。`,
  (a: string, d: string, dmg: number) =>
    `🧠 ${a} 部署心理战术，${d} 专注力下降，损失 ${dmg} 点。`,
  (a: string, d: string, dmg: number) =>
    `🚀 ${a} 全速冲刺，对 ${d} 发动奇袭，造成 ${dmg} 点伤害！`,
  (a: string, d: string, dmg: number) =>
    `🛡 ${a} 抓住破绽，反手给了 ${d} ${dmg} 点反击伤害。`,
];

const COUNTER_ACTIONS = [
  (d: string, saved: number) =>
    `  ↳ ${d} 触发防御机制，抵消了 ${saved} 点伤害！`,
  (d: string) => `  ↳ ${d} 紧急修复，恢复了少量系统稳定性。`,
  (d: string) => `  ↳ ${d} 发出警报，提升下一轮攻击力！`,
];

function getStatTotal(stats: MiiStats): number {
  return Object.values(stats).reduce((sum, v) => sum + v, 0);
}

function getMaxStat(stats: MiiStats): number {
  return Math.max(...Object.values(stats));
}

function simulateBattle(a: MiiCharacter, b: MiiCharacter): BattleResult {
  const MAX_HP = 200;
  let aHp = MAX_HP;
  let bHp = MAX_HP;
  const logs: BattleLog[] = [];

  // Base attack derived from stats
  const aAtk = getStatTotal(a.stats) / 50;
  const bAtk = getStatTotal(b.stats) / 50;
  const aDef = a.stats.focus / 10;
  const bDef = b.stats.focus / 10;

  let round = 0;
  const MAX_ROUNDS = 12;

  while (aHp > 0 && bHp > 0 && round < MAX_ROUNDS) {
    round++;

    // A attacks B
    const aDamageRaw = Math.round(aAtk * (0.7 + Math.random() * 0.6) + getMaxStat(a.stats) / 15);
    const aDamage = Math.max(5, aDamageRaw - Math.round(bDef * Math.random()));
    bHp = Math.max(0, bHp - aDamage);
    const actionA = ROUND_ACTIONS[Math.floor(Math.random() * ROUND_ACTIONS.length)](
      a.name, b.name, aDamage
    );
    logs.push({
      round,
      attacker: a.name,
      defender: b.name,
      action: actionA,
      attackerHp: aHp,
      defenderHp: bHp,
      damage: aDamage,
    });

    if (bHp <= 0) break;

    // B attacks A
    const bDamageRaw = Math.round(bAtk * (0.7 + Math.random() * 0.6) + getMaxStat(b.stats) / 15);
    const bDamage = Math.max(5, bDamageRaw - Math.round(aDef * Math.random()));
    aHp = Math.max(0, aHp - bDamage);
    const actionB = ROUND_ACTIONS[Math.floor(Math.random() * ROUND_ACTIONS.length)](
      b.name, a.name, bDamage
    );
    logs.push({
      round,
      attacker: b.name,
      defender: a.name,
      action: actionB,
      attackerHp: aHp,
      defenderHp: bHp,
      damage: bDamage,
    });
  }

  // If drawn after max rounds, use stat total to decide
  const winner = aHp >= bHp ? a : b;
  const loser = aHp >= bHp ? b : a;

  return { winner, loser, logs, totalRounds: round };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BattlePage() {
  const [characters, setCharacters] = useState<MiiCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [charA, setCharA] = useState<MiiCharacter | null>(null);
  const [charB, setCharB] = useState<MiiCharacter | null>(null);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [battleKey, setBattleKey] = useState(0);

  useEffect(() => {
    fetch("/api/mii")
      .then((r) => r.json())
      .then((d) => setCharacters(d.characters ?? []))
      .finally(() => setLoading(false));
  }, []);

  const startBattle = () => {
    if (!charA || !charB || charA.id === charB.id) return;
    setBattleKey((k) => k + 1);
    setResult(simulateBattle(charA, charB));
  };

  const reset = () => {
    setResult(null);
    setBattleKey((k) => k + 1);
  };

  const hpPercent = (hp: number) => Math.max(0, Math.min(100, (hp / 200) * 100));

  // Track running HP for each character in battle logs
  const getHpAfterLog = (logs: BattleLog[], charName: string, upToIndex: number): number => {
    let hp = 200;
    for (let i = 0; i <= upToIndex; i++) {
      if (logs[i].defender === charName) hp = Math.max(0, hp - logs[i].damage);
    }
    return hp;
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: "var(--text-muted)", textAlign: "center", paddingTop: 80 }}>
        加载中…
      </div>
    );
  }

  if (characters.length < 2) {
    return (
      <div style={{ padding: 24 }}>
        <Link href="/mii" style={{ ...backLinkStyle }}>
          <ArrowLeft size={14} /> 返回角色大厅
        </Link>
        <div style={{ textAlign: "center", paddingTop: 60, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚔️</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-secondary)" }}>
            需要至少 2 名角色才能开启对战
          </div>
          <Link href="/mii" style={{ ...btnPrimary, display: "inline-flex", marginTop: 20, textDecoration: "none" }}>
            去创建角色
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
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
          <Swords style={{ color: "var(--accent)" }} size={26} />
          角色对战模拟
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          选择两名角色，按能力值模拟一场任务对决
        </p>
      </div>

      {/* Character selection */}
      {!result && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 16,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <CharacterSelector
            label="选择挑战者 A"
            characters={characters}
            selected={charA}
            exclude={charB?.id}
            onSelect={setCharA}
          />
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "var(--text-muted)",
              textAlign: "center",
              userSelect: "none",
            }}
          >
            VS
          </div>
          <CharacterSelector
            label="选择挑战者 B"
            characters={characters}
            selected={charB}
            exclude={charA?.id}
            onSelect={setCharB}
          />
        </div>
      )}

      {/* Battle button */}
      {!result && (
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <button
            type="button"
            onClick={startBattle}
            disabled={!charA || !charB || charA.id === charB.id}
            style={{
              ...btnPrimary,
              fontSize: 16,
              padding: "14px 36px",
              opacity: !charA || !charB || charA.id === charB.id ? 0.4 : 1,
              cursor: !charA || !charB || charA.id === charB.id ? "not-allowed" : "pointer",
            }}
          >
            <Swords size={18} />
            开始对战！
          </button>
        </div>
      )}

      {/* Battle result */}
      {result && (
        <div key={battleKey}>
          {/* Winner banner */}
          <div
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "24px",
              textAlign: "center",
              marginBottom: 20,
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(circle at 50% 0%, rgba(255,215,0,0.12), transparent 60%)",
              }}
            />
            <Trophy size={36} style={{ color: "#FFD60A", marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
              共 {result.totalRounds} 轮战斗
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFD60A" }}>
              🏆 {result.winner.name} 获胜！
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
              {ROLE_ICONS[result.winner.role]} {result.winner.role} 击败了{" "}
              {ROLE_ICONS[result.loser.role]} {result.loser.role} · {result.loser.name}
            </div>
          </div>

          {/* HP bars */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[result.winner, result.loser].map((char, idx) => {
              const finalLog = result.logs[result.logs.length - 1];
              const isWinner = char.id === result.winner.id;
              const hpRemaining = isWinner
                ? getHpAfterLog(result.logs, char.name, result.logs.length - 1)
                : 0;
              return (
                <div
                  key={char.id}
                  style={{
                    backgroundColor: "var(--card)",
                    border: `1px solid ${isWinner ? "#FFD60A55" : "var(--border)"}`,
                    borderRadius: 16,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flexShrink: 0 }}>
                      <MiiAvatar appearance={char.avatar} size={44} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: isWinner ? "#FFD60A" : "var(--text-primary)", fontSize: 15 }}>
                        {isWinner ? "🏆 " : "💀 "}{char.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {ROLE_ICONS[char.role]} {char.role}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                      <span>HP</span>
                      <span>{hpRemaining} / 200</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, backgroundColor: "var(--border)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${hpPercent(hpRemaining)}%`,
                          borderRadius: 999,
                          backgroundColor: isWinner ? "#32D74B" : "#FF453A",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Battle log */}
          <div
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
              ⚔️ 战斗日志
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
              {result.logs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    color: log.attacker === result.winner.name ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)",
                    padding: "6px 10px",
                    borderRadius: 8,
                    backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.03)",
                    borderLeft: `3px solid ${log.attacker === result.winner.name ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 8 }}>
                    R{log.round}
                  </span>
                  {log.action}
                </div>
              ))}
            </div>
          </div>

          {/* Reset button */}
          <div style={{ textAlign: "center" }}>
            <button type="button" onClick={reset} style={{ ...btnSecondary }}>
              <RefreshCw size={14} />
              再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CharacterSelector({
  label,
  characters,
  selected,
  exclude,
  onSelect,
}: {
  label: string;
  characters: MiiCharacter[];
  selected: MiiCharacter | null;
  exclude?: string;
  onSelect: (c: MiiCharacter) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }}>
        {label}
      </div>
      {selected ? (
        <div
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--accent)",
            borderRadius: 16,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
          onClick={() => onSelect(selected)}
        >
          <MiiAvatar appearance={selected.avatar} size={72} />
          <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15, textAlign: "center" }}>
            {selected.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {ROLE_ICONS[selected.role]} {selected.role}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {(["execution", "creativity", "coordination", "focus", "leadership", "adaptability"] as const).map((stat) => (
              <div key={stat} style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {STAT_LABELS[stat]}: <strong style={{ color: "var(--text-primary)" }}>{selected.stats[stat]}</strong>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>点击切换</div>
        </div>
      ) : (
        <div
          style={{
            borderRadius: 16,
            border: "1px dashed var(--border)",
            padding: "32px 16px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          请选择角色
        </div>
      )}

      {/* Selector dropdown */}
      <select
        value={selected?.id ?? ""}
        onChange={(e) => {
          const c = characters.find((ch) => ch.id === e.target.value);
          if (c) onSelect(c);
        }}
        style={{
          marginTop: 8,
          width: "100%",
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface-elevated)",
          color: "var(--text-primary)",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        <option value="">— 选择角色 —</option>
        {characters
          .filter((c) => c.id !== exclude)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {ROLE_ICONS[c.role]} {c.name} ({c.role})
            </option>
          ))}
      </select>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STAT_LABELS = {
  execution: "执行",
  creativity: "创意",
  coordination: "协调",
  focus: "专注",
  leadership: "领导",
  adaptability: "适应",
} as const;

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

const btnSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 20px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface-elevated)",
  color: "var(--text-secondary)",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};
