/**
 * AgentRow Component
 * Based on Component/AgentRow from tenacios-design.json
 *
 * Optionally renders a MiiAvatarCard instead of the emoji icon
 * when a bound Mii character is provided via the `miiCharacter` prop.
 */

import { MiiAvatarCard } from "@/components/mii/MiiAvatar";
import type { MiiCharacter } from "@/lib/mii-types";

const STATUS_COLORS: Record<MiiCharacter["status"], string> = {
  online: "#32D74B",
  busy: "#FFD60A",
  idle: "#0A84FF",
  offline: "#525252",
};

interface AgentRowProps {
  emoji: string;
  name: string;
  status: string;
  model: string;
  statusDot?: "positive" | "info" | "warning" | "negative" | "muted";
  /** If provided, replaces the emoji with the character's Mii avatar */
  miiCharacter?: MiiCharacter;
}

export function AgentRow({
  emoji,
  name,
  status,
  model,
  statusDot = "positive",
  miiCharacter,
}: AgentRowProps) {
  const dotColorMap = {
    positive: "var(--positive)",
    info: "var(--info)",
    warning: "var(--warning)",
    negative: "var(--negative)",
    muted: "var(--text-muted)",
  };

  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: "8px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {/* Status Dot */}
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: dotColorMap[statusDot],
          flexShrink: 0,
        }}
      />

      {/* Mii Avatar or Emoji */}
      {miiCharacter ? (
        <MiiAvatarCard
          appearance={miiCharacter.avatar}
          size={32}
          statusColor={STATUS_COLORS[miiCharacter.status]}
        />
      ) : (
        <div
          style={{
            fontSize: "18px",
            lineHeight: "18px",
            flexShrink: 0,
          }}
        >
          {emoji}
        </div>
      )}

      {/* Agent Info */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {miiCharacter ? miiCharacter.name : name}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "var(--text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {miiCharacter ? `${miiCharacter.role} · ${status}` : status}
        </div>
      </div>

      {/* Model Badge */}
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "1px",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        {model}
      </div>
    </div>
  );
}
