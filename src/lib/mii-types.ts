/**
 * Mii Character System — Type Definitions
 *
 * Parametric character model inspired by Nintendo Mii.
 * All visual parameters drive the SVG renderer in MiiAvatar.tsx.
 */

// ─── Avatar Appearance ───────────────────────────────────────────────────────

export type FaceShape = "round" | "oval" | "square" | "heart" | "diamond";

export type HairStyle =
  | "short-straight"
  | "medium-wavy"
  | "long-straight"
  | "bob"
  | "mohawk"
  | "bald"
  | "spiky"
  | "bun"
  | "side-swept"
  | "ponytail"
  | "pigtails"
  | "curly"
  | "afro"
  | "braids";

export type HairColor =
  | "black"
  | "dark-brown"
  | "brown"
  | "light-brown"
  | "blonde"
  | "red"
  | "auburn"
  | "gray"
  | "white"
  | "blue"
  | "purple"
  | "pink"
  | "green";

export type SkinTone =
  | "porcelain"
  | "fair"
  | "medium"
  | "olive"
  | "tan"
  | "brown"
  | "dark"
  | "deep";

export type EyeStyle = "round" | "oval" | "narrow" | "wide" | "star" | "anime";
export type EyeColor = "brown" | "blue" | "green" | "gray" | "black" | "purple" | "amber";

export type EyebrowStyle = "normal" | "thick" | "thin" | "arched" | "worried" | "angry" | "raised";
export type MouthStyle = "smile" | "big-smile" | "neutral" | "smirk" | "open-happy" | "slight-frown";

export type AccessoryType = "none" | "glasses" | "sunglasses" | "hat-cap" | "hat-beanie" | "headband" | "earrings" | "helmet";
export type ShirtStyle = "plain" | "collar" | "hoodie" | "tank" | "turtleneck";

export interface MiiAppearance {
  faceShape: FaceShape;
  skinTone: SkinTone;

  hairStyle: HairStyle;
  hairColor: HairColor;

  eyeStyle: EyeStyle;
  eyeColor: EyeColor;

  eyebrowStyle: EyebrowStyle;
  eyebrowColor: HairColor;

  mouthStyle: MouthStyle;

  /** Nose size: 0–2, where 0=none, 1=small, 2=medium */
  noseSize: 0 | 1 | 2;

  accessory: AccessoryType;
  accessoryColor: string; // hex

  shirtStyle: ShirtStyle;
  shirtColor: string; // hex

  /** Cheek blush: 0=none, 1=light, 2=strong */
  blush: 0 | 1 | 2;

  /** Facial hair: 0=none, 1=stubble, 2=beard, 3=mustache */
  facialHair: 0 | 1 | 2 | 3;
  facialHairColor: HairColor;
}

// ─── Character Stats ──────────────────────────────────────────────────────────

export interface MiiStats {
  /** Ability to execute tasks reliably (0–100) */
  execution: number;
  /** Creative problem solving ability (0–100) */
  creativity: number;
  /** Multi-agent coordination skill (0–100) */
  coordination: number;
  /** Focus and concentration rating (0–100) */
  focus: number;
  /** Leadership and decision-making ability (0–100) */
  leadership: number;
  /** Adaptability and flexibility (0–100) */
  adaptability: number;
}

// ─── openclaw / Docker Binding ───────────────────────────────────────────────

export type BindingMode = "primary" | "secondary";

export type BindingDuty =
  | "主控"
  | "开发"
  | "测试"
  | "部署"
  | "监控"
  | "研究"
  | "支援";

export interface MiiInstanceBinding {
  instanceId: string;
  mode: BindingMode;
  duty: BindingDuty;
  label?: string;
  autoLaunch?: boolean;
}

// ─── Personality & Role ───────────────────────────────────────────────────────

export type Personality =
  | "严肃"
  | "活泼"
  | "冷静"
  | "热情"
  | "谨慎"
  | "大胆"
  | "友善"
  | "独立"
  | "协作"
  | "创意"
  | "精准"
  | "领导力"
  | "团队协作";

export type CharacterRole =
  | "工程师"
  | "指挥官"
  | "侦察员"
  | "守卫"
  | "分析师"
  | "设计师"
  | "协调员"
  | "研究员"
  | "测试员"
  | "部署员"
  | "探索者";

// ─── Character Status ─────────────────────────────────────────────────────────

export type CharacterStatus = "online" | "busy" | "idle" | "offline";

// ─── Full Character Model ─────────────────────────────────────────────────────

export interface MiiCharacter {
  id: string;
  name: string;
  avatar: MiiAppearance;
  personality: Personality[];
  role: CharacterRole;
  description: string;
  /** Short catchphrase shown as a speech bubble on the character card */
  catchphrase?: string;
  /** AI-generated or manually written backstory */
  backstory?: string;
  /** Legacy single-binding field kept for backward compatibility. */
  dockerInstanceId?: string;
  /** Primary openclaw Docker instance bound to this role. */
  primaryInstanceId?: string;
  /** Multiple openclaw Docker instance bindings with role-specific duties. */
  instanceBindings: MiiInstanceBinding[];
  stats: MiiStats;
  status: CharacterStatus;
  /** Display order in gallery (lower = earlier) */
  order?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Docker Instance (from openclaw-control-plane) ────────────────────────────

export interface DockerInstance {
  id: string;
  name: string;
  status: "running" | "stopped" | "error" | "unknown";
  workspace?: string;
  model?: string;
  emoji?: string;
  color?: string;
  runtime?: "docker" | "openclaw" | "unknown";
  containerName?: string;
  composeService?: string;
  image?: string;
  assignedCharacterId?: string;
  assignedCharacterName?: string;
  assignedDuty?: BindingDuty;
}

// ─── Default Values ───────────────────────────────────────────────────────────

export const DEFAULT_APPEARANCE: MiiAppearance = {
  faceShape: "round",
  skinTone: "medium",
  hairStyle: "short-straight",
  hairColor: "black",
  eyeStyle: "round",
  eyeColor: "brown",
  eyebrowStyle: "normal",
  eyebrowColor: "black",
  mouthStyle: "smile",
  noseSize: 1,
  accessory: "none",
  accessoryColor: "#888888",
  shirtStyle: "plain",
  shirtColor: "#3B82F6",
  blush: 0,
  facialHair: 0,
  facialHairColor: "black",
};

export const DEFAULT_STATS: MiiStats = {
  execution: 50,
  creativity: 50,
  coordination: 50,
  focus: 50,
  leadership: 50,
  adaptability: 50,
};

export const DEFAULT_INSTANCE_BINDING: Pick<
  MiiInstanceBinding,
  "mode" | "duty" | "autoLaunch"
> = {
  mode: "secondary",
  duty: "支援",
  autoLaunch: false,
};

export const SKIN_TONE_COLORS: Record<SkinTone, string> = {
  porcelain: "#FDEEE0",
  fair: "#F5D5BE",
  medium: "#E8B88A",
  olive: "#D4A76A",
  tan: "#C68642",
  brown: "#A0522D",
  dark: "#7B3F00",
  deep: "#4A2000",
};

export const HAIR_COLOR_VALUES: Record<HairColor, string> = {
  "black": "#1A1A1A",
  "dark-brown": "#3B2314",
  "brown": "#6B3A2A",
  "light-brown": "#9B6B4A",
  "blonde": "#F2C97A",
  "red": "#C0392B",
  "auburn": "#922B21",
  "gray": "#9E9E9E",
  "white": "#F5F5F5",
  "blue": "#2980B9",
  "purple": "#8E44AD",
  "pink": "#E91E8C",
  "green": "#27AE60",
};

export const ROLE_ICONS: Record<CharacterRole, string> = {
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

export const PERSONALITY_COLORS: Record<Personality, string> = {
  严肃: "#6366f1",
  活泼: "#f59e0b",
  冷静: "#06b6d4",
  热情: "#ef4444",
  谨慎: "#8b5cf6",
  大胆: "#f97316",
  友善: "#10b981",
  独立: "#3b82f6",
  协作: "#14b8a6",
  创意: "#ec4899",
  精准: "#64748b",
  领导力: "#e11d48",
  团队协作: "#0ea5e9",
};

export const EYE_COLOR_VALUES: Record<EyeColor, string> = {
  brown: "#6B3A2A",
  blue: "#2980B9",
  green: "#27AE60",
  gray: "#7F8C8D",
  black: "#1A1A1A",
  purple: "#8E44AD",
  amber: "#F39C12",
};
