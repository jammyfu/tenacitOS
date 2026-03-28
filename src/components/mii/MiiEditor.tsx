/**
 * MiiEditor — richer Mii-like character customization with openclaw bindings
 */

"use client";

import React, { useMemo, useState } from "react";
import { BookOpen, Loader2, WandSparkles } from "lucide-react";
import { MiiAvatar } from "./MiiAvatar";
import { MiiRadarChart } from "./MiiRadarChart";
import type {
  BindingDuty,
  CharacterRole,
  DockerInstance,
  EyeColor,
  EyeStyle,
  EyebrowStyle,
  FaceShape,
  HairColor,
  HairStyle,
  MiiAppearance,
  MiiCharacter,
  MiiInstanceBinding,
  MiiStats,
  MouthStyle,
  Personality,
  SkinTone,
  AccessoryType,
  ShirtStyle,
} from "@/lib/mii-types";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_STATS,
  EYE_COLOR_VALUES,
  HAIR_COLOR_VALUES,
  PERSONALITY_COLORS,
  ROLE_ICONS,
  SKIN_TONE_COLORS,
} from "@/lib/mii-types";
import { normalizeCharacter } from "@/lib/mii-utils";

const FACE_SHAPES: FaceShape[] = ["round", "oval", "square", "heart", "diamond"];
const HAIR_STYLES: HairStyle[] = [
  "short-straight",
  "medium-wavy",
  "long-straight",
  "bob",
  "mohawk",
  "bald",
  "spiky",
  "bun",
  "side-swept",
  "ponytail",
  "pigtails",
  "curly",
  "afro",
  "braids",
];
const HAIR_COLORS = Object.keys(HAIR_COLOR_VALUES) as HairColor[];
const SKIN_TONES = Object.keys(SKIN_TONE_COLORS) as SkinTone[];
const EYE_STYLES: EyeStyle[] = ["round", "oval", "narrow", "wide", "star", "anime"];
const EYE_COLORS = Object.keys(EYE_COLOR_VALUES) as EyeColor[];
const EYEBROW_STYLES: EyebrowStyle[] = [
  "normal",
  "thick",
  "thin",
  "arched",
  "worried",
  "angry",
  "raised",
];
const MOUTH_STYLES: MouthStyle[] = [
  "smile",
  "big-smile",
  "neutral",
  "smirk",
  "open-happy",
  "slight-frown",
];
const ACCESSORY_TYPES: AccessoryType[] = [
  "none",
  "glasses",
  "sunglasses",
  "hat-cap",
  "hat-beanie",
  "headband",
  "earrings",
  "helmet",
];
const SHIRT_STYLES: ShirtStyle[] = ["plain", "collar", "hoodie", "tank", "turtleneck"];
const PERSONALITIES: Personality[] = [
  "严肃",
  "活泼",
  "冷静",
  "热情",
  "谨慎",
  "大胆",
  "友善",
  "独立",
  "协作",
  "创意",
  "精准",
  "领导力",
  "团队协作",
];
const ROLES: CharacterRole[] = [
  "工程师",
  "指挥官",
  "侦察员",
  "守卫",
  "分析师",
  "设计师",
  "协调员",
  "研究员",
  "测试员",
  "部署员",
  "探索者",
];
const DUTIES: BindingDuty[] = ["主控", "开发", "测试", "部署", "监控", "研究", "支援"];
const SHIRT_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#6B7280",
  "#14B8A6",
  "#1A1A1A",
  "#FFFFFF",
];
const ACCESSORY_COLORS = [
  "#1A1A1A",
  "#888888",
  "#C0392B",
  "#2980B9",
  "#27AE60",
  "#F39C12",
  "#8E44AD",
  "#FFFFFF",
  "#D4A76A",
];
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
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: color,
            border:
              color === value ? "3px solid var(--accent)" : "2px solid var(--border)",
            cursor: "pointer",
          }}
          title={color}
        />
      ))}
    </div>
  );
}

function PillSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: `1px solid ${value === option ? "var(--accent)" : "var(--border)"}`,
            backgroundColor: value === option ? "var(--accent)" : "var(--surface-elevated)",
            color: value === option ? "#fff" : "var(--text-secondary)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: 18,
        backgroundColor: "var(--card)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
        {title}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function StatSlider({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (next: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 72, fontSize: 12, color: "var(--text-secondary)" }}>
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ flex: 1, accentColor: color }}
      />
      <span style={{ width: 28, textAlign: "right", fontSize: 12, color }}>
        {value}
      </span>
    </div>
  );
}

interface MiiEditorProps {
  initial?: Partial<MiiCharacter>;
  dockerInstances: DockerInstance[];
  onSave: (character: MiiCharacter) => void;
  onCancel: () => void;
}

export function MiiEditor({
  initial,
  dockerInstances,
  onSave,
  onCancel,
}: MiiEditorProps) {
  const normalized = useMemo(
    () => normalizeCharacter(initial ?? {}),
    [initial]
  );

  const [name, setName] = useState(normalized.name);
  const [role, setRole] = useState<CharacterRole>(normalized.role);
  const [description, setDescription] = useState(normalized.description);
  const [personalities, setPersonalities] = useState<Personality[]>(normalized.personality);
  const [stats, setStats] = useState<MiiStats>(normalized.stats ?? DEFAULT_STATS);
  const [appearance, setAppearance] = useState<MiiAppearance>(
    normalized.avatar ?? DEFAULT_APPEARANCE
  );
  const [status, setStatus] = useState<MiiCharacter["status"]>(normalized.status);
  const [primaryInstanceId, setPrimaryInstanceId] = useState(
    normalized.primaryInstanceId ?? ""
  );
  const [bindings, setBindings] = useState<MiiInstanceBinding[]>(
    normalized.instanceBindings ?? []
  );
  const [catchphrase, setCatchphrase] = useState(normalized.catchphrase ?? "");
  const [backstory, setBackstory] = useState(normalized.backstory ?? "");
  const [generatingBackstory, setGeneratingBackstory] = useState(false);

  const generateBackstory = async () => {
    setGeneratingBackstory(true);
    try {
      const res = await fetch("/api/mii/generate-backstory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, personality: personalities, stats, description }),
      });
      const data = await res.json();
      if (data.backstory) setBackstory(data.backstory);
    } catch {
      // ignore
    } finally {
      setGeneratingBackstory(false);
    }
  };

  const setApp = (patch: Partial<MiiAppearance>) =>
    setAppearance((current) => ({ ...current, ...patch }));

  const setBinding = (instanceId: string, patch: Partial<MiiInstanceBinding>) => {
    setBindings((current) => {
      const existing = current.find((binding) => binding.instanceId === instanceId);
      if (existing) {
        return current.map((binding) =>
          binding.instanceId === instanceId ? { ...binding, ...patch } : binding
        );
      }
      return [
        ...current,
        {
          instanceId,
          mode: instanceId === primaryInstanceId ? "primary" : "secondary",
          duty: instanceId === primaryInstanceId ? "主控" : "支援",
          autoLaunch: false,
          ...patch,
        },
      ];
    });
  };

  const removeBinding = (instanceId: string) => {
    setBindings((current) => current.filter((binding) => binding.instanceId !== instanceId));
  };

  const togglePersonality = (trait: Personality) => {
    setPersonalities((current) =>
      current.includes(trait)
        ? current.filter((item) => item !== trait)
        : current.length < 3
          ? [...current, trait]
          : current
    );
  };

  const applyRandomLook = () => {
    const randomFrom = <T extends string>(values: T[]) =>
      values[Math.floor(Math.random() * values.length)];

    const hairColor = randomFrom(HAIR_COLORS);
    setAppearance({
      faceShape: randomFrom(FACE_SHAPES),
      skinTone: randomFrom(SKIN_TONES),
      hairStyle: randomFrom(HAIR_STYLES),
      hairColor,
      eyeStyle: randomFrom(EYE_STYLES),
      eyeColor: randomFrom(EYE_COLORS),
      eyebrowStyle: randomFrom(EYEBROW_STYLES),
      eyebrowColor: hairColor,
      mouthStyle: randomFrom(MOUTH_STYLES),
      noseSize: Math.floor(Math.random() * 3) as 0 | 1 | 2,
      accessory: randomFrom(ACCESSORY_TYPES),
      accessoryColor:
        ACCESSORY_COLORS[Math.floor(Math.random() * ACCESSORY_COLORS.length)],
      shirtStyle: randomFrom(SHIRT_STYLES),
      shirtColor: SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)],
      blush: Math.floor(Math.random() * 3) as 0 | 1 | 2,
      facialHair: Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3,
      facialHairColor: hairColor,
    });
  };

  const handlePrimaryInstanceChange = (instanceId: string) => {
    setPrimaryInstanceId(instanceId);
    setBindings((current) => {
      const next = current
        .filter((binding) => binding.instanceId !== instanceId)
        .map((binding) => ({
          ...binding,
          mode: "secondary" as const,
          duty: binding.duty === "主控" ? "支援" : binding.duty,
        }));

      if (!instanceId) {
        return next;
      }

      return [
        {
          instanceId,
          mode: "primary",
          duty: "主控",
          label: "主控实例",
          autoLaunch: true,
        },
        ...next,
      ];
    });
  };

  const handleSave = () => {
    const secondaryBindings = bindings
      .filter((binding) => binding.instanceId !== primaryInstanceId)
      .map((binding) => ({
        ...binding,
        mode: "secondary" as const,
        duty: binding.duty === "主控" ? "支援" : binding.duty,
      }));

    const nextBindings = primaryInstanceId
      ? [
          {
            instanceId: primaryInstanceId,
            mode: "primary" as const,
            duty: "主控" as const,
            label: "主控实例",
            autoLaunch: true,
          },
          ...secondaryBindings,
        ]
      : secondaryBindings;

    onSave(
      normalizeCharacter({
        ...normalized,
        name,
        role,
        description,
        personality: personalities,
        stats,
        avatar: appearance,
        status,
        catchphrase: catchphrase.trim() || undefined,
        backstory: backstory.trim() || undefined,
        primaryInstanceId: primaryInstanceId || undefined,
        dockerInstanceId: primaryInstanceId || undefined,
        instanceBindings: nextBindings,
        updatedAt: new Date().toISOString(),
      })
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px minmax(0, 1fr)",
        gap: 20,
        minHeight: 620,
      }}
    >
      <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            borderRadius: 24,
            padding: 20,
            background:
              "radial-gradient(circle at top, rgba(255,255,255,0.16), transparent 45%), linear-gradient(180deg, #0f172a, #111827)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Mii Studio</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{name || "未命名角色"}</div>
            </div>
            <button
              type="button"
              onClick={applyRandomLook}
              style={{
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "#fff",
                padding: "8px 10px",
                cursor: "pointer",
              }}
              title="随机形象"
            >
              <WandSparkles size={16} />
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "radial-gradient(circle at 50% 25%, rgba(255,255,255,0.28), transparent 45%), rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <MiiAvatar
                appearance={appearance}
                size={150}
                statusColor={STATUS_COLORS[status]}
              />
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <Field label="角色名称">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例如：Infra 守望者"
                style={inputStyle(true)}
              />
            </Field>

            <Field label="角色定位">
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as CharacterRole)}
                style={inputStyle(true)}
              >
                {ROLES.map((item) => (
                  <option key={item} value={item}>
                    {ROLE_ICONS[item] ?? ""} {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="运行状态">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(Object.keys(STATUS_LABELS) as Array<MiiCharacter["status"]>).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setStatus(item)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: `1px solid ${status === item ? STATUS_COLORS[item] : "rgba(255,255,255,0.14)"}`,
                      backgroundColor:
                        status === item ? `${STATUS_COLORS[item]}30` : "rgba(255,255,255,0.04)",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {STATUS_LABELS[item]}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="角色说明">
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="这个角色负责什么、和哪些实例协作。"
                style={{ ...inputStyle(true), resize: "vertical", minHeight: 92 }}
              />
            </Field>

            <Field label="💬 座右铭">
              <input
                value={catchphrase}
                onChange={(e) => setCatchphrase(e.target.value)}
                placeholder="角色的口头禅…"
                maxLength={40}
                style={inputStyle(true)}
              />
            </Field>

            <Field label="📖 背景故事">
              <div style={{ position: "relative" }}>
                <textarea
                  rows={5}
                  value={backstory}
                  onChange={(e) => setBackstory(e.target.value)}
                  placeholder="角色的背景故事，可手动填写或点击下方按钮自动生成…"
                  style={{ ...inputStyle(true), resize: "vertical", minHeight: 110, paddingBottom: 44 }}
                />
                <button
                  type="button"
                  onClick={generateBackstory}
                  disabled={generatingBackstory}
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface-elevated)",
                    color: generatingBackstory ? "var(--text-muted)" : "var(--accent)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: generatingBackstory ? "not-allowed" : "pointer",
                  }}
                >
                  {generatingBackstory ? (
                    <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <BookOpen size={12} />
                  )}
                  {generatingBackstory ? "生成中…" : "AI 生成故事"}
                </button>
              </div>
            </Field>
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            当前编组
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {personalities.map((item) => {
              const color = PERSONALITY_COLORS[item as keyof typeof PERSONALITY_COLORS] ?? "#6366f1";
              return (
                <span
                  key={item}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    backgroundColor: color + "22",
                    border: `1px solid ${color}55`,
                    fontSize: 12,
                    color,
                  }}
                >
                  {item}
                </span>
              );
            })}
            {personalities.length === 0 && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>未选择性格</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
            主实例: {primaryInstanceId || "未绑定"} · 协作实例:{" "}
            {Math.max(bindings.filter((binding) => binding.instanceId !== primaryInstanceId).length, 0)}
          </div>
        </div>

        {/* Radar chart preview */}
        <div
          style={{
            borderRadius: 18,
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            能力雷达图
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <MiiRadarChart
              stats={stats}
              accentColor={HAIR_COLOR_VALUES[appearance.hairColor] ?? "#3B82F6"}
              size={180}
              showLabels
            />
          </div>
        </div>
      </aside>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Section title="角色性格与能力">
          <Field label="性格标签（最多 3 个）">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PERSONALITIES.map((trait) => {
                const isSelected = personalities.includes(trait);
                const color = PERSONALITY_COLORS[trait as keyof typeof PERSONALITY_COLORS] ?? "#6366f1";
                const disabled = !isSelected && personalities.length >= 3;
                return (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => togglePersonality(trait)}
                    disabled={disabled}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: `1px solid ${isSelected ? color : "var(--border)"}`,
                      backgroundColor: isSelected ? color + "33" : "var(--surface-elevated)",
                      color: isSelected ? color : disabled ? "var(--text-muted)" : "var(--text-secondary)",
                      cursor: disabled ? "not-allowed" : "pointer",
                      fontSize: 12,
                      opacity: disabled ? 0.5 : 1,
                      fontWeight: isSelected ? 700 : 400,
                    }}
                  >
                    {trait}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              已选 {personalities.length}/3
            </div>
          </Field>
          <StatSlider
            label="执行力"
            value={stats.execution}
            color="#FF3B30"
            onChange={(next) => setStats((current) => ({ ...current, execution: next }))}
          />
          <StatSlider
            label="创造力"
            value={stats.creativity}
            color="#BF5AF2"
            onChange={(next) => setStats((current) => ({ ...current, creativity: next }))}
          />
          <StatSlider
            label="协调力"
            value={stats.coordination}
            color="#0A84FF"
            onChange={(next) => setStats((current) => ({ ...current, coordination: next }))}
          />
          <StatSlider
            label="专注度"
            value={stats.focus}
            color="#32D74B"
            onChange={(next) => setStats((current) => ({ ...current, focus: next }))}
          />
          <StatSlider
            label="领导力"
            value={stats.leadership ?? 50}
            color="#FF9F0A"
            onChange={(next) => setStats((current) => ({ ...current, leadership: next }))}
          />
          <StatSlider
            label="适应力"
            value={stats.adaptability ?? 50}
            color="#30D158"
            onChange={(next) => setStats((current) => ({ ...current, adaptability: next }))}
          />
        </Section>

        <Section title="实例绑定与职责编排">
          <Field label="主实例">
            <select
              value={primaryInstanceId}
              onChange={(event) => handlePrimaryInstanceChange(event.target.value)}
              style={inputStyle()}
            >
              <option value="">暂不绑定</option>
              {dockerInstances.map((instance) => (
                <option key={instance.id} value={instance.id}>
                  {instance.emoji || "🤖"} {instance.name}
                </option>
              ))}
            </select>
          </Field>

          <div style={{ display: "grid", gap: 10 }}>
            {dockerInstances.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                暂未发现 openclaw Docker 实例，保存角色后仍可先配置外观与职责。
              </div>
            )}

            {dockerInstances.map((instance) => {
              const binding = bindings.find((item) => item.instanceId === instance.id);
              const isPrimary = primaryInstanceId === instance.id;
              const active = Boolean(binding) || isPrimary;
              return (
                <div
                  key={instance.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: 14,
                    backgroundColor: active ? "var(--surface-elevated)" : "transparent",
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                        color: "var(--text-primary)",
                        fontWeight: 600,
                      }}
                    >
                      <span>{instance.emoji || "🤖"}</span>
                      <span>{instance.name}</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: instance.status === "running" ? "#32D74B" : "var(--text-muted)",
                        }}
                      >
                        {instance.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      {instance.containerName || instance.workspace || instance.id}
                    </div>
                  </div>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      disabled={isPrimary}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setBinding(instance.id, {
                            duty: binding?.duty || "支援",
                            mode: "secondary",
                            autoLaunch: binding?.autoLaunch ?? false,
                          });
                        } else {
                          removeBinding(instance.id);
                        }
                      }}
                    />
                    {isPrimary ? "主控" : "加入角色编组"}
                  </label>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select
                      value={isPrimary ? "主控" : binding?.duty || "支援"}
                      disabled={!active || isPrimary}
                      onChange={(event) =>
                        setBinding(instance.id, {
                          duty: event.target.value as BindingDuty,
                          mode: "secondary",
                        })
                      }
                      style={{ ...inputStyle(), minWidth: 112 }}
                    >
                      {DUTIES.map((duty) => (
                        <option key={duty} value={duty}>
                          {duty}
                        </option>
                      ))}
                    </select>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: "var(--text-secondary)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isPrimary ? true : binding?.autoLaunch ?? false}
                        disabled={!active}
                        onChange={(event) =>
                          setBinding(instance.id, { autoLaunch: event.target.checked })
                        }
                      />
                      自动拉起
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Mii 外观定制">
          <Field label="脸型">
            <PillSelector
              options={FACE_SHAPES}
              value={appearance.faceShape}
              onChange={(value) => setApp({ faceShape: value })}
            />
          </Field>
          <Field label="肤色">
            <SwatchPicker
              colors={Object.values(SKIN_TONE_COLORS)}
              value={SKIN_TONE_COLORS[appearance.skinTone]}
              onChange={(color) => {
                const tone =
                  (Object.entries(SKIN_TONE_COLORS).find(([, item]) => item === color)?.[0] as SkinTone) ||
                  appearance.skinTone;
                setApp({ skinTone: tone });
              }}
            />
          </Field>
          <Field label="发型">
            <PillSelector
              options={HAIR_STYLES}
              value={appearance.hairStyle}
              onChange={(value) => setApp({ hairStyle: value })}
            />
          </Field>
          <Field label="发色">
            <SwatchPicker
              colors={Object.values(HAIR_COLOR_VALUES)}
              value={HAIR_COLOR_VALUES[appearance.hairColor]}
              onChange={(color) => {
                const nextHairColor =
                  (Object.entries(HAIR_COLOR_VALUES).find(([, item]) => item === color)?.[0] as HairColor) ||
                  appearance.hairColor;
                setApp({
                  hairColor: nextHairColor,
                  eyebrowColor: nextHairColor,
                  facialHairColor: nextHairColor,
                });
              }}
            />
          </Field>
          <Field label="眼型">
            <PillSelector
              options={EYE_STYLES}
              value={appearance.eyeStyle}
              onChange={(value) => setApp({ eyeStyle: value })}
            />
          </Field>
          <Field label="眼色">
            <SwatchPicker
              colors={Object.values(EYE_COLOR_VALUES)}
              value={EYE_COLOR_VALUES[appearance.eyeColor]}
              onChange={(color) => {
                const nextEyeColor =
                  (Object.entries(EYE_COLOR_VALUES).find(([, item]) => item === color)?.[0] as EyeColor) ||
                  appearance.eyeColor;
                setApp({ eyeColor: nextEyeColor });
              }}
            />
          </Field>
          <Field label="眉型">
            <PillSelector
              options={EYEBROW_STYLES}
              value={appearance.eyebrowStyle}
              onChange={(value) => setApp({ eyebrowStyle: value })}
            />
          </Field>
          <Field label="嘴型">
            <PillSelector
              options={MOUTH_STYLES}
              value={appearance.mouthStyle}
              onChange={(value) => setApp({ mouthStyle: value })}
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <Field label="鼻子">
              <select
                value={appearance.noseSize}
                onChange={(event) =>
                  setApp({ noseSize: Number(event.target.value) as 0 | 1 | 2 })
                }
                style={inputStyle()}
              >
                <option value={0}>无</option>
                <option value={1}>小</option>
                <option value={2}>中</option>
              </select>
            </Field>

            <Field label="腮红">
              <select
                value={appearance.blush}
                onChange={(event) =>
                  setApp({ blush: Number(event.target.value) as 0 | 1 | 2 })
                }
                style={inputStyle()}
              >
                <option value={0}>无</option>
                <option value={1}>淡</option>
                <option value={2}>深</option>
              </select>
            </Field>

            <Field label="胡须">
              <select
                value={appearance.facialHair}
                onChange={(event) =>
                  setApp({ facialHair: Number(event.target.value) as 0 | 1 | 2 | 3 })
                }
                style={inputStyle()}
              >
                <option value={0}>无</option>
                <option value={1}>胡茬</option>
                <option value={2}>胡须</option>
                <option value={3}>小胡子</option>
              </select>
            </Field>
          </div>
          <Field label="配件">
            <PillSelector
              options={ACCESSORY_TYPES}
              value={appearance.accessory}
              onChange={(value) => setApp({ accessory: value })}
            />
          </Field>
          {appearance.accessory !== "none" && (
            <Field label="配件颜色">
              <SwatchPicker
                colors={ACCESSORY_COLORS}
                value={appearance.accessoryColor}
                onChange={(color) => setApp({ accessoryColor: color })}
              />
            </Field>
          )}
          <Field label="服装样式">
            <PillSelector
              options={SHIRT_STYLES}
              value={appearance.shirtStyle}
              onChange={(value) => setApp({ shirtStyle: value })}
            />
          </Field>
          <Field label="服装颜色">
            <SwatchPicker
              colors={SHIRT_COLORS}
              value={appearance.shirtColor}
              onChange={(color) => setApp({ shirtColor: color })}
            />
          </Field>
        </Section>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingBottom: 8 }}>
          <button type="button" onClick={onCancel} style={secondaryButtonStyle}>
            取消
          </button>
          <button type="button" onClick={handleSave} style={primaryButtonStyle}>
            保存角色
          </button>
        </div>
      </div>
    </div>
  );
}

function inputStyle(invert = false): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: invert ? "1px solid rgba(255,255,255,0.12)" : "1px solid var(--border)",
    backgroundColor: invert ? "rgba(255,255,255,0.04)" : "var(--surface-elevated)",
    color: invert ? "#fff" : "var(--text-primary)",
    fontSize: 13,
  };
}

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 12,
  border: "none",
  backgroundColor: "var(--accent)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface-elevated)",
  color: "var(--text-secondary)",
  cursor: "pointer",
};
