/**
 * MiiEditor — Visual character creation / editing interface
 *
 * Two-panel layout:
 *  Left  → live SVG preview + name / role / description / stats
 *  Right → appearance sliders / selectors organized in collapsible sections
 */

"use client";

import React, { useState } from "react";
import { MiiAvatar } from "./MiiAvatar";
import type {
  MiiCharacter,
  MiiAppearance,
  MiiStats,
  Personality,
  CharacterRole,
  FaceShape,
  HairStyle,
  HairColor,
  SkinTone,
  EyeStyle,
  EyeColor,
  EyebrowStyle,
  MouthStyle,
  AccessoryType,
  ShirtStyle,
} from "@/lib/mii-types";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_STATS,
  SKIN_TONE_COLORS,
  HAIR_COLOR_VALUES,
  EYE_COLOR_VALUES,
} from "@/lib/mii-types";
// ─── Randomizer ───────────────────────────────────────────────────────────────

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAppearance(): MiiAppearance {
  const hairColor = randomPick(Object.keys(HAIR_COLOR_VALUES) as HairColor[]);
  const shirtColors = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
    "#EC4899", "#06B6D4", "#F97316", "#6B7280", "#14B8A6",
    "#1A1A1A", "#FFFFFF",
  ];
  return {
    faceShape: randomPick(["round", "oval", "square", "heart", "diamond"] as FaceShape[]),
    skinTone: randomPick(Object.keys(SKIN_TONE_COLORS) as SkinTone[]),
    hairStyle: randomPick([
      "short-straight", "medium-wavy", "long-straight", "bob",
      "mohawk", "bald", "spiky", "bun", "side-swept",
    ] as HairStyle[]),
    hairColor,
    eyeStyle: randomPick(["round", "oval", "narrow", "wide", "star", "anime"] as EyeStyle[]),
    eyeColor: randomPick(Object.keys(EYE_COLOR_VALUES) as EyeColor[]),
    eyebrowStyle: randomPick([
      "normal", "thick", "thin", "arched", "worried", "angry", "raised",
    ] as EyebrowStyle[]),
    eyebrowColor: hairColor,
    mouthStyle: randomPick([
      "smile", "big-smile", "neutral", "smirk", "open-happy", "slight-frown",
    ] as MouthStyle[]),
    noseSize: randomPick([0, 1, 2] as (0 | 1 | 2)[]),
    accessory: randomPick([
      "none", "none", "none", "glasses", "sunglasses",
      "hat-cap", "hat-beanie", "headband", "earrings",
    ] as AccessoryType[]),
    accessoryColor: randomPick(["#1A1A1A", "#888888", "#C0392B", "#2980B9", "#27AE60", "#F39C12"]),
    shirtStyle: randomPick(["plain", "collar", "hoodie", "tank", "turtleneck"] as ShirtStyle[]),
    shirtColor: randomPick(shirtColors),
    blush: randomPick([0, 0, 0, 1, 2] as (0 | 1 | 2)[]),
    facialHair: randomPick([0, 0, 0, 0, 1, 2, 3] as (0 | 1 | 2 | 3)[]),
    facialHairColor: hairColor,
  };
}

// ─── Option Lists ─────────────────────────────────────────────────────────────

const FACE_SHAPES: FaceShape[] = ["round", "oval", "square", "heart", "diamond"];
const HAIR_STYLES: HairStyle[] = [
  "short-straight", "medium-wavy", "long-straight", "bob",
  "mohawk", "bald", "spiky", "bun", "side-swept",
];
const HAIR_COLORS = Object.keys(HAIR_COLOR_VALUES) as HairColor[];
const SKIN_TONES = Object.keys(SKIN_TONE_COLORS) as SkinTone[];
const EYE_STYLES: EyeStyle[] = ["round", "oval", "narrow", "wide", "star", "anime"];
const EYE_COLORS = Object.keys(EYE_COLOR_VALUES) as EyeColor[];
const EYEBROW_STYLES: EyebrowStyle[] = [
  "normal", "thick", "thin", "arched", "worried", "angry", "raised",
];
const MOUTH_STYLES: MouthStyle[] = [
  "smile", "big-smile", "neutral", "smirk", "open-happy", "slight-frown",
];
const ACCESSORY_TYPES: AccessoryType[] = [
  "none", "glasses", "sunglasses", "hat-cap", "hat-beanie", "headband", "earrings",
];
const SHIRT_STYLES: ShirtStyle[] = ["plain", "collar", "hoodie", "tank", "turtleneck"];

const PERSONALITIES: Personality[] = [
  "严肃", "活泼", "冷静", "热情", "谨慎", "大胆", "友善", "独立", "协作", "创意",
];
const ROLES: CharacterRole[] = [
  "工程师", "指挥官", "侦察员", "守卫", "分析师", "设计师", "协调员", "研究员", "测试员", "部署员",
];

const SHIRT_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6B7280", "#14B8A6",
  "#1A1A1A", "#FFFFFF",
];
const ACCESSORY_COLORS = [
  "#1A1A1A", "#888888", "#C0392B", "#2980B9", "#27AE60",
  "#F39C12", "#8E44AD", "#FFFFFF", "#D4A76A",
];

const STATUS_COLORS: Record<MiiCharacter["status"], string> = {
  online: "#32D74B",
  busy: "#FFD60A",
  idle: "#0A84FF",
  offline: "#525252",
};

// ─── Helper: color swatch picker ─────────────────────────────────────────────

function SwatchPicker({
  colors,
  value,
  onChange,
}: {
  colors: string[];
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: c,
            border: c === value ? "3px solid var(--accent)" : "2px solid var(--border)",
            cursor: "pointer",
            padding: 0,
          }}
          title={c}
        />
      ))}
    </div>
  );
}

// ─── Helper: option pill selector ────────────────────────────────────────────

function PillSelector<T extends string>({
  options,
  value,
  onChange,
  small,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  small?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            padding: small ? "2px 8px" : "4px 12px",
            borderRadius: "999px",
            fontSize: small ? "11px" : "12px",
            fontWeight: 500,
            cursor: "pointer",
            backgroundColor:
              opt === value ? "var(--accent)" : "var(--surface-elevated)",
            color: opt === value ? "#FFF" : "var(--text-secondary)",
            border: `1px solid ${opt === value ? "var(--accent)" : "var(--border)"}`,
            transition: "all 0.15s",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Helper: stat slider ──────────────────────────────────────────────────────

function StatSlider({
  label,
  value,
  onChange,
  color = "var(--accent)",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ width: 64, fontSize: 12, color: "var(--text-secondary)", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, position: "relative", height: 6, borderRadius: 3, backgroundColor: "var(--border)" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            borderRadius: 3,
            width: `${value}%`,
            backgroundColor: color,
            transition: "width 0.1s",
          }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            width: "100%",
            cursor: "pointer",
          }}
        />
      </div>
      <span style={{ width: 28, fontSize: 12, color: "var(--text-primary)", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

// ─── Collapsible section wrapper ──────────────────────────────────────────────

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {title}
        <span style={{ color: "var(--text-muted)", fontSize: 16 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

interface MiiEditorProps {
  initial?: Partial<MiiCharacter>;
  onSave: (character: MiiCharacter) => void;
  onCancel: () => void;
}

export function MiiEditor({ initial, onSave, onCancel }: MiiEditorProps) {
  const [name, setName] = useState(initial?.name ?? "新角色");
  const [role, setRole] = useState<CharacterRole>(initial?.role ?? "工程师");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [personalities, setPersonalities] = useState<Personality[]>(
    initial?.personality ?? ["友善"]
  );
  const [stats, setStats] = useState<MiiStats>(initial?.stats ?? DEFAULT_STATS);
  const [appearance, setAppearance] = useState<MiiAppearance>(
    initial?.avatar ?? DEFAULT_APPEARANCE
  );
  const [status, setStatus] = useState<MiiCharacter["status"]>(
    initial?.status ?? "offline"
  );

  const setApp = (patch: Partial<MiiAppearance>) =>
    setAppearance((prev) => ({ ...prev, ...patch }));

  const togglePersonality = (p: Personality) => {
    setPersonalities((prev) =>
      prev.includes(p)
        ? prev.filter((x) => x !== p)
        : prev.length < 3
        ? [...prev, p]
        : prev
    );
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const character: MiiCharacter = {
      id: initial?.id ?? crypto.randomUUID(),
      name,
      role,
      description,
      personality: personalities,
      stats,
      avatar: appearance,
      status,
      dockerInstanceId: initial?.dockerInstanceId,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    onSave(character);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        height: "100%",
        overflow: "hidden",
        minHeight: 520,
      }}
    >
      {/* ── Left: Preview ── */}
      <div
        style={{
          width: 220,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          padding: "16px 0",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, var(--surface-elevated), var(--surface))",
            borderRadius: 20,
            padding: 16,
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MiiAvatar
            appearance={appearance}
            size={140}
            statusColor={STATUS_COLORS[status]}
          />
        </div>

        {/* Randomize button */}
        <button
          onClick={() => setAppearance(randomAppearance())}
          style={{
            width: "100%",
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface-elevated)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          🎲 随机外观
        </button>

        {/* Name input */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="角色名称"
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface-elevated)",
            color: "var(--text-primary)",
            fontSize: 14,
            fontWeight: 600,
            textAlign: "center",
          }}
        />

        {/* Role */}
        <div style={{ width: "100%" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            职责
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as CharacterRole)}
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text-primary)",
              fontSize: 13,
            }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div style={{ width: "100%" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            状态
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["online", "busy", "idle", "offline"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  padding: "3px 10px",
                  borderRadius: "999px",
                  fontSize: 11,
                  cursor: "pointer",
                  backgroundColor: status === s ? STATUS_COLORS[s] + "30" : "var(--surface-elevated)",
                  color: STATUS_COLORS[s],
                  border: `1px solid ${status === s ? STATUS_COLORS[s] : "var(--border)"}`,
                  fontWeight: status === s ? 700 : 400,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Personality */}
        <div style={{ width: "100%" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            性格 (最多3个)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {PERSONALITIES.map((p) => (
              <button
                key={p}
                onClick={() => togglePersonality(p)}
                style={{
                  padding: "3px 8px",
                  borderRadius: "999px",
                  fontSize: 11,
                  cursor: "pointer",
                  backgroundColor: personalities.includes(p)
                    ? "var(--accent)"
                    : "var(--surface-elevated)",
                  color: personalities.includes(p) ? "#FFF" : "var(--text-secondary)",
                  border: `1px solid ${personalities.includes(p) ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="角色背景故事..."
          rows={3}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface-elevated)",
            color: "var(--text-secondary)",
            fontSize: 12,
            resize: "vertical",
          }}
        />
      </div>

      {/* ── Right: Appearance editor ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          paddingRight: 4,
        }}
      >
        {/* Stats */}
        <Section title="⚡ 能力值">
          <StatSlider label="执行力" value={stats.execution} onChange={(v) => setStats((s) => ({ ...s, execution: v }))} color="#FF3B30" />
          <StatSlider label="创造力" value={stats.creativity} onChange={(v) => setStats((s) => ({ ...s, creativity: v }))} color="#BF5AF2" />
          <StatSlider label="协调力" value={stats.coordination} onChange={(v) => setStats((s) => ({ ...s, coordination: v }))} color="#0A84FF" />
          <StatSlider label="专注度" value={stats.focus} onChange={(v) => setStats((s) => ({ ...s, focus: v }))} color="#32D74B" />
        </Section>

        {/* Face */}
        <Section title="👤 脸型 & 肤色">
          <Row label="脸型">
            <PillSelector options={FACE_SHAPES} value={appearance.faceShape} onChange={(v) => setApp({ faceShape: v })} small />
          </Row>
          <Row label="肤色">
            <SwatchPicker
              colors={Object.values(SKIN_TONE_COLORS)}
              value={SKIN_TONE_COLORS[appearance.skinTone]}
              onChange={(c) => {
                const tone = (Object.entries(SKIN_TONE_COLORS).find(([, v]) => v === c)?.[0] as SkinTone) ?? appearance.skinTone;
                setApp({ skinTone: tone });
              }}
            />
          </Row>
          <Row label="腮红">
            <PillSelector
              options={["无", "淡", "深"] as any}
              value={(["无", "淡", "深"] as any)[appearance.blush]}
              onChange={(v) => {
                const idx = ["无", "淡", "深"].indexOf(v as string);
                setApp({ blush: (idx >= 0 ? idx : 0) as 0 | 1 | 2 });
              }}
              small
            />
          </Row>
        </Section>

        {/* Hair */}
        <Section title="💇 发型">
          <Row label="发型">
            <PillSelector options={HAIR_STYLES} value={appearance.hairStyle} onChange={(v) => setApp({ hairStyle: v })} small />
          </Row>
          <Row label="发色">
            <SwatchPicker
              colors={Object.values(HAIR_COLOR_VALUES)}
              value={HAIR_COLOR_VALUES[appearance.hairColor]}
              onChange={(c) => {
                const hc = (Object.entries(HAIR_COLOR_VALUES).find(([, v]) => v === c)?.[0] as HairColor) ?? appearance.hairColor;
                setApp({ hairColor: hc, eyebrowColor: hc, facialHairColor: hc });
              }}
            />
          </Row>
        </Section>

        {/* Eyes */}
        <Section title="👁️ 眼睛 & 眉毛">
          <Row label="眼型">
            <PillSelector options={EYE_STYLES} value={appearance.eyeStyle} onChange={(v) => setApp({ eyeStyle: v })} small />
          </Row>
          <Row label="眼色">
            <SwatchPicker
              colors={Object.values(EYE_COLOR_VALUES)}
              value={EYE_COLOR_VALUES[appearance.eyeColor]}
              onChange={(c) => {
                const ec = (Object.entries(EYE_COLOR_VALUES).find(([, v]) => v === c)?.[0] as EyeColor) ?? appearance.eyeColor;
                setApp({ eyeColor: ec });
              }}
            />
          </Row>
          <Row label="眉型">
            <PillSelector options={EYEBROW_STYLES} value={appearance.eyebrowStyle} onChange={(v) => setApp({ eyebrowStyle: v })} small />
          </Row>
        </Section>

        {/* Mouth & Nose */}
        <Section title="👄 嘴型 & 鼻子" defaultOpen={false}>
          <Row label="嘴型">
            <PillSelector options={MOUTH_STYLES} value={appearance.mouthStyle} onChange={(v) => setApp({ mouthStyle: v })} small />
          </Row>
          <Row label="鼻子">
            <PillSelector
              options={["无", "小", "中"] as any}
              value={(["无", "小", "中"] as any)[appearance.noseSize]}
              onChange={(v) => {
                const idx = ["无", "小", "中"].indexOf(v as string);
                setApp({ noseSize: (idx >= 0 ? idx : 0) as 0 | 1 | 2 });
              }}
              small
            />
          </Row>
          <Row label="胡须">
            <PillSelector
              options={["无", "胡茬", "胡须", "小胡子"] as any}
              value={(["无", "胡茬", "胡须", "小胡子"] as any)[appearance.facialHair]}
              onChange={(v) => {
                const idx = ["无", "胡茬", "胡须", "小胡子"].indexOf(v as string);
                setApp({ facialHair: (idx >= 0 ? idx : 0) as 0 | 1 | 2 | 3 });
              }}
              small
            />
          </Row>
        </Section>

        {/* Accessories */}
        <Section title="🎩 配件 & 服装" defaultOpen={false}>
          <Row label="配件">
            <PillSelector options={ACCESSORY_TYPES} value={appearance.accessory} onChange={(v) => setApp({ accessory: v })} small />
          </Row>
          {appearance.accessory !== "none" && (
            <Row label="配件颜色">
              <SwatchPicker
                colors={ACCESSORY_COLORS}
                value={appearance.accessoryColor}
                onChange={(c) => setApp({ accessoryColor: c })}
              />
            </Row>
          )}
          <Row label="上衣款式">
            <PillSelector options={SHIRT_STYLES} value={appearance.shirtStyle} onChange={(v) => setApp({ shirtStyle: v })} small />
          </Row>
          <Row label="上衣颜色">
            <SwatchPicker
              colors={SHIRT_COLORS}
              value={appearance.shirtColor}
              onChange={(c) => setApp({ shirtColor: c })}
            />
          </Row>
        </Section>
      </div>

      {/* ── Action buttons (bottom of left panel) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 24px",
          backgroundColor: "var(--surface)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 12,
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface-elevated)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          取消
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: "8px 24px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "var(--accent)",
            color: "#FFF",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          保存角色
        </button>
      </div>
    </div>
  );
}
