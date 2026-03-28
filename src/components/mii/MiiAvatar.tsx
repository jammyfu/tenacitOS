/**
 * MiiAvatar — Parametric SVG character renderer (Mii-style)
 *
 * Renders a fully customizable character from a MiiAppearance object.
 * All visual elements are pure SVG paths/shapes — no external assets needed.
 */

import React from "react";
import type { MiiAppearance } from "@/lib/mii-types";
import {
  SKIN_TONE_COLORS,
  HAIR_COLOR_VALUES,
  EYE_COLOR_VALUES,
} from "@/lib/mii-types";

interface MiiAvatarProps {
  appearance: MiiAppearance;
  size?: number;
  /** Show a status dot in the bottom-right corner */
  statusColor?: string;
  className?: string;
}

// ─── Head Shape Paths ────────────────────────────────────────────────────────
// All paths are relative to a 100×120 canvas centered at (50, 60)
function headPath(shape: MiiAppearance["faceShape"]): string {
  switch (shape) {
    case "oval":
      return "M50,15 C72,15 85,30 85,55 C85,80 72,95 50,95 C28,95 15,80 15,55 C15,30 28,15 50,15 Z";
    case "square":
      return "M20,20 L80,20 C83,20 85,22 85,25 L85,82 C85,87 80,92 75,92 L25,92 C20,92 15,87 15,82 L15,25 C15,22 17,20 20,20 Z";
    case "heart":
      return "M50,90 C30,75 10,60 10,40 C10,25 22,18 35,20 C42,21 47,26 50,30 C53,26 58,21 65,20 C78,18 90,25 90,40 C90,60 70,75 50,90 Z";
    case "diamond":
      return "M50,10 L85,52 C85,55 83,58 80,60 L50,95 L20,60 C17,58 15,55 15,52 Z";
    case "round":
    default:
      return "M50,15 C72,15 85,33 85,55 C85,77 72,92 50,92 C28,92 15,77 15,55 C15,33 28,15 50,15 Z";
  }
}

// ─── Hair Shapes ─────────────────────────────────────────────────────────────
function HairLayer({
  style,
  color,
  skinColor,
}: {
  style: MiiAppearance["hairStyle"];
  color: string;
  skinColor: string;
}) {
  switch (style) {
    case "bald":
      return null;
    case "short-straight":
      return (
        <>
          <path
            d="M15,55 C15,33 28,15 50,15 C72,15 85,33 85,55 L85,38 C85,20 70,8 50,8 C30,8 15,20 15,38 Z"
            fill={color}
          />
          <path
            d="M15,38 C15,20 30,8 50,8 L50,8 C30,8 15,20 15,38 Z"
            fill={color}
            opacity="0.6"
          />
        </>
      );
    case "medium-wavy":
      return (
        <path
          d="M12,55 C10,30 25,5 50,5 C75,5 90,30 88,55 C90,40 82,15 65,10 C72,18 70,30 72,35 C68,25 60,18 50,15 C40,18 32,25 28,35 C30,30 28,18 35,10 C18,15 10,40 12,55 Z"
          fill={color}
        />
      );
    case "long-straight":
      return (
        <>
          <path
            d="M15,55 C15,33 28,15 50,15 C72,15 85,33 85,55 L87,70 C87,90 75,105 62,112 L62,112 C67,100 70,88 68,75 C72,80 78,72 80,62 L80,45 C80,28 66,12 50,12 C34,12 20,28 20,45 L20,62 C22,72 28,80 32,75 C30,88 33,100 38,112 C25,105 13,90 13,70 Z"
            fill={color}
          />
        </>
      );
    case "bob":
      return (
        <path
          d="M15,55 C15,33 28,15 50,15 C72,15 85,33 85,55 L86,68 C86,76 82,80 78,80 L72,82 C65,84 58,85 50,85 C42,85 35,84 28,82 L22,80 C18,80 14,76 14,68 Z"
          fill={color}
        />
      );
    case "mohawk":
      return (
        <>
          <rect x="44" y="3" width="12" height="28" rx="5" fill={color} />
          <path
            d="M15,55 C15,33 28,15 50,15 C72,15 85,33 85,55 L85,40 C85,30 75,20 63,16 C58,14 52,12 50,12 C48,12 42,14 37,16 C25,20 15,30 15,40 Z"
            fill={skinColor}
          />
          <rect x="44" y="3" width="12" height="28" rx="5" fill={color} />
        </>
      );
    case "spiky":
      return (
        <path
          d="M50,8 L56,2 L60,12 L66,4 L68,16 L76,8 L74,22 L84,18 L80,32 L88,32 C88,32 85,50 85,55 C85,33 72,15 50,15 C28,15 15,33 15,55 C15,50 12,32 12,32 L20,32 L16,18 L26,22 L22,8 L32,16 L30,4 L38,12 L44,2 Z"
          fill={color}
        />
      );
    case "bun":
      return (
        <>
          <circle cx="50" cy="10" r="12" fill={color} />
          <path
            d="M15,55 C15,33 28,15 50,15 C72,15 85,33 85,55 L85,40 C80,22 65,12 50,12 C35,12 20,22 15,40 Z"
            fill={color}
          />
        </>
      );
    case "side-swept":
    default:
      return (
        <path
          d="M15,55 C15,33 28,15 50,15 C72,15 85,33 85,55 L85,35 C82,15 70,5 55,5 C38,5 18,12 15,35 Z"
          fill={color}
        />
      );
  }
}

// ─── Eyes ────────────────────────────────────────────────────────────────────
function Eyes({
  style,
  color,
}: {
  style: MiiAppearance["eyeStyle"];
  color: string;
}) {
  const pupils = (cx: number, cy: number, rx: number, ry: number) => (
    <>
      <ellipse cx={cx} cy={cy} rx={rx + 2} ry={ry + 2} fill="white" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} />
      <circle cx={cx + rx * 0.3} cy={cy - ry * 0.3} r={rx * 0.3} fill="white" opacity="0.8" />
      <ellipse cx={cx} cy={cy} rx={rx * 0.4} ry={ry * 0.4} fill="#000" />
    </>
  );

  switch (style) {
    case "oval":
      return (
        <g>
          {pupils(33, 52, 6, 7)}
          {pupils(67, 52, 6, 7)}
        </g>
      );
    case "narrow":
      return (
        <g>
          {pupils(33, 52, 7, 4)}
          {pupils(67, 52, 7, 4)}
        </g>
      );
    case "wide":
      return (
        <g>
          {pupils(32, 52, 8, 8)}
          {pupils(68, 52, 8, 8)}
        </g>
      );
    case "star":
      return (
        <g>
          <path
            d="M33,44 L35,49 L40,49 L36,53 L38,58 L33,55 L28,58 L30,53 L26,49 L31,49 Z"
            fill={color}
          />
          <path
            d="M67,44 L69,49 L74,49 L70,53 L72,58 L67,55 L62,58 L64,53 L60,49 L65,49 Z"
            fill={color}
          />
          <circle cx="33" cy="51" r="2" fill="white" opacity="0.8" />
          <circle cx="67" cy="51" r="2" fill="white" opacity="0.8" />
        </g>
      );
    case "anime":
      return (
        <g>
          <ellipse cx="33" cy="52" rx="8" ry="9" fill="white" />
          <ellipse cx="67" cy="52" rx="8" ry="9" fill="white" />
          <ellipse cx="33" cy="53" rx="6" ry="7" fill={color} />
          <ellipse cx="67" cy="53" rx="6" ry="7" fill={color} />
          <circle cx="31" cy="50" r="2.5" fill="white" opacity="0.9" />
          <circle cx="65" cy="50" r="2.5" fill="white" opacity="0.9" />
          <ellipse cx="33" cy="54" rx="3" ry="3.5" fill="#000" />
          <ellipse cx="67" cy="54" rx="3" ry="3.5" fill="#000" />
        </g>
      );
    case "round":
    default:
      return (
        <g>
          {pupils(33, 52, 6, 6)}
          {pupils(67, 52, 6, 6)}
        </g>
      );
  }
}

// ─── Eyebrows ────────────────────────────────────────────────────────────────
function Eyebrows({
  style,
  color,
}: {
  style: MiiAppearance["eyebrowStyle"];
  color: string;
}) {
  const strokeProps = {
    stroke: color,
    strokeWidth: 2.5,
    strokeLinecap: "round" as const,
    fill: "none",
  };

  switch (style) {
    case "thick":
      return (
        <g>
          <path d="M24,43 Q33,39 42,42" stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
          <path d="M58,42 Q67,39 76,43" stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
        </g>
      );
    case "thin":
      return (
        <g>
          <path d="M25,43 Q33,40 41,43" {...strokeProps} strokeWidth={1.5} />
          <path d="M59,43 Q67,40 75,43" {...strokeProps} strokeWidth={1.5} />
        </g>
      );
    case "arched":
      return (
        <g>
          <path d="M23,45 Q33,37 43,43" {...strokeProps} />
          <path d="M57,43 Q67,37 77,45" {...strokeProps} />
        </g>
      );
    case "worried":
      return (
        <g>
          <path d="M23,42 Q33,45 43,42" {...strokeProps} />
          <path d="M57,42 Q67,45 77,42" {...strokeProps} />
        </g>
      );
    case "angry":
      return (
        <g>
          <path d="M24,44 Q33,40 42,43" {...strokeProps} strokeWidth={3} />
          <path d="M58,43 Q67,40 76,44" {...strokeProps} strokeWidth={3} />
        </g>
      );
    case "raised":
      return (
        <g>
          <path d="M24,40 Q33,37 42,40" {...strokeProps} />
          <path d="M58,40 Q67,37 76,40" {...strokeProps} />
        </g>
      );
    case "normal":
    default:
      return (
        <g>
          <path d="M24,43 Q33,40 42,43" {...strokeProps} />
          <path d="M58,43 Q67,40 76,43" {...strokeProps} />
        </g>
      );
  }
}

// ─── Mouth ───────────────────────────────────────────────────────────────────
function Mouth({ style, skinColor }: { style: MiiAppearance["mouthStyle"]; skinColor: string }) {
  switch (style) {
    case "big-smile":
      return (
        <g>
          <path d="M32,70 Q50,82 68,70" stroke="#C0392B" strokeWidth={2.5} strokeLinecap="round" fill="none" />
          <path d="M32,70 Q50,85 68,70 Q50,78 32,70 Z" fill="#C0392B" opacity="0.6" />
        </g>
      );
    case "neutral":
      return (
        <path d="M34,72 L66,72" stroke="#A0522D" strokeWidth={2} strokeLinecap="round" fill="none" />
      );
    case "smirk":
      return (
        <path d="M35,72 Q50,78 65,70" stroke="#C0392B" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      );
    case "open-happy":
      return (
        <g>
          <path d="M32,70 Q50,86 68,70" stroke="#C0392B" strokeWidth={2.5} fill="none" />
          <path d="M32,70 Q50,86 68,70 Q68,76 50,76 Q32,76 32,70 Z" fill="#E74C3C" />
          <ellipse cx="50" cy="80" rx="8" ry="3" fill="#FADADD" />
        </g>
      );
    case "slight-frown":
      return (
        <path d="M35,74 Q50,68 65,74" stroke="#A0522D" strokeWidth={2} strokeLinecap="round" fill="none" />
      );
    case "smile":
    default:
      return (
        <path d="M34,70 Q50,80 66,70" stroke="#C0392B" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      );
  }
}

// ─── Nose ────────────────────────────────────────────────────────────────────
function Nose({ size, skinColor }: { size: 0 | 1 | 2; skinColor: string }) {
  const shadow = skinColor + "80";
  if (size === 0) return null;
  if (size === 1) {
    return <ellipse cx="50" cy="63" rx="3" ry="2" fill={shadow} />;
  }
  return (
    <g>
      <path d="M44,65 Q50,58 56,65" stroke={shadow} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <circle cx="45" cy="65" r="2" fill={shadow} />
      <circle cx="55" cy="65" r="2" fill={shadow} />
    </g>
  );
}

// ─── Blush ───────────────────────────────────────────────────────────────────
function Blush({ level }: { level: 0 | 1 | 2 }) {
  if (level === 0) return null;
  const opacity = level === 1 ? 0.25 : 0.45;
  return (
    <g>
      <ellipse cx="22" cy="62" rx="8" ry="5" fill="#FF6B8A" opacity={opacity} />
      <ellipse cx="78" cy="62" rx="8" ry="5" fill="#FF6B8A" opacity={opacity} />
    </g>
  );
}

// ─── Facial Hair ─────────────────────────────────────────────────────────────
function FacialHair({ level, color }: { level: 0 | 1 | 2 | 3; color: string }) {
  if (level === 0) return null;
  if (level === 1) {
    // Stubble
    return (
      <g opacity="0.5">
        {[33, 38, 43, 48, 53, 58, 63].map((x, i) =>
          [76, 79, 82].map((y, j) => (
            <circle key={`${i}-${j}`} cx={x} cy={y} r={0.8} fill={color} />
          ))
        )}
      </g>
    );
  }
  if (level === 2) {
    // Beard
    return (
      <path
        d="M22,70 Q25,88 35,93 Q50,98 65,93 Q75,88 78,70 Q65,82 50,83 Q35,82 22,70 Z"
        fill={color}
        opacity="0.85"
      />
    );
  }
  // Mustache
  return (
    <path
      d="M35,68 Q42,74 50,72 Q58,74 65,68 Q58,72 50,69 Q42,72 35,68 Z"
      fill={color}
      opacity="0.9"
    />
  );
}

// ─── Accessories ─────────────────────────────────────────────────────────────
function Accessory({
  type,
  color,
}: {
  type: MiiAppearance["accessory"];
  color: string;
}) {
  switch (type) {
    case "glasses":
      return (
        <g fill="none" stroke={color} strokeWidth="2">
          <circle cx="33" cy="52" r="10" />
          <circle cx="67" cy="52" r="10" />
          <line x1="43" y1="52" x2="57" y2="52" />
          <line x1="15" y1="50" x2="23" y2="52" />
          <line x1="77" y1="52" x2="85" y2="50" />
        </g>
      );
    case "sunglasses":
      return (
        <g>
          <rect x="20" y="44" width="26" height="16" rx="8" fill={color} opacity="0.85" />
          <rect x="54" y="44" width="26" height="16" rx="8" fill={color} opacity="0.85" />
          <line x1="46" y1="52" x2="54" y2="52" stroke={color} strokeWidth="2" />
          <line x1="15" y1="49" x2="20" y2="51" stroke={color} strokeWidth="2" />
          <line x1="80" y1="51" x2="85" y2="49" stroke={color} strokeWidth="2" />
        </g>
      );
    case "hat-cap":
      return (
        <g>
          <ellipse cx="50" cy="20" rx="38" ry="8" fill={color} />
          <rect x="18" y="5" width="64" height="18" rx="8" fill={color} />
          <ellipse cx="50" cy="5" rx="32" ry="5" fill={color} opacity="0.7" />
        </g>
      );
    case "hat-beanie":
      return (
        <g>
          <path
            d="M18,35 C18,15 82,15 82,35 L82,22 C82,8 18,8 18,22 Z"
            fill={color}
          />
          <circle cx="50" cy="8" r="5" fill={color} opacity="0.9" />
          <rect x="16" y="33" width="68" height="6" rx="3" fill={color} opacity="0.7" />
        </g>
      );
    case "headband":
      return (
        <rect x="12" y="30" width="76" height="8" rx="4" fill={color} opacity="0.85" />
      );
    case "earrings":
      return (
        <g>
          <circle cx="14" cy="58" r="3" fill={color} />
          <circle cx="86" cy="58" r="3" fill={color} />
        </g>
      );
    case "none":
    default:
      return null;
  }
}

// ─── Body / Shirt ─────────────────────────────────────────────────────────────
function Body({
  style,
  color,
  skinColor,
}: {
  style: MiiAppearance["shirtStyle"];
  color: string;
  skinColor: string;
}) {
  switch (style) {
    case "collar":
      return (
        <g>
          <path
            d="M20,97 Q50,110 80,97 L90,135 L10,135 Z"
            fill={color}
          />
          <path d="M42,97 L50,108 L58,97 L50,100 Z" fill="white" />
        </g>
      );
    case "hoodie":
      return (
        <g>
          <path d="M20,97 Q50,112 80,97 L92,135 L8,135 Z" fill={color} />
          <path
            d="M35,97 Q50,115 65,97 Q65,102 55,105 Q50,107 45,105 Q35,102 35,97 Z"
            fill={color}
            opacity="0.7"
          />
          <rect x="44" y="102" width="12" height="8" rx="2" fill={color} opacity="0.5" />
        </g>
      );
    case "tank":
      return (
        <g>
          <path
            d="M28,97 Q50,108 72,97 L80,135 L20,135 Z"
            fill={color}
          />
          <path d="M28,97 L24,110" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M72,97 L76,110" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
        </g>
      );
    case "turtleneck":
      return (
        <g>
          <path d="M20,97 Q50,110 80,97 L88,135 L12,135 Z" fill={color} />
          <rect x="36" y="90" width="28" height="10" rx="4" fill={color} />
        </g>
      );
    case "plain":
    default:
      return (
        <path
          d="M20,97 Q50,110 80,97 L88,135 L12,135 Z"
          fill={color}
        />
      );
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const MiiAvatar = React.forwardRef<SVGSVGElement, MiiAvatarProps>(
function MiiAvatar({
  appearance,
  size = 100,
  statusColor,
  className,
}: MiiAvatarProps, ref) {
  const skinColor = SKIN_TONE_COLORS[appearance.skinTone];
  const hairColor = HAIR_COLOR_VALUES[appearance.hairColor];
  const eyeColor = EYE_COLOR_VALUES[appearance.eyeColor];
  const eyebrowColor = HAIR_COLOR_VALUES[appearance.eyebrowColor];
  const facialHairColor = HAIR_COLOR_VALUES[appearance.facialHairColor];

  return (
    <svg
      ref={ref}
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block" }}
    >
      {/* Neck */}
      <rect x="42" y="90" width="16" height="10" rx="4" fill={skinColor} />

      {/* Body / Shirt */}
      <Body style={appearance.shirtStyle} color={appearance.shirtColor} skinColor={skinColor} />

      {/* Head base */}
      <path d={headPath(appearance.faceShape)} fill={skinColor} />

      {/* Hair (behind face features but on top of head fill) */}
      <HairLayer style={appearance.hairStyle} color={hairColor} skinColor={skinColor} />

      {/* Blush */}
      <Blush level={appearance.blush} />

      {/* Nose */}
      <Nose size={appearance.noseSize} skinColor={skinColor} />

      {/* Eyes */}
      <Eyes style={appearance.eyeStyle} color={eyeColor} />

      {/* Eyebrows */}
      <Eyebrows style={appearance.eyebrowStyle} color={eyebrowColor} />

      {/* Mouth */}
      <Mouth style={appearance.mouthStyle} skinColor={skinColor} />

      {/* Facial Hair */}
      <FacialHair level={appearance.facialHair} color={facialHairColor} />

      {/* Accessory (on top) */}
      <Accessory type={appearance.accessory} color={appearance.accessoryColor} />

      {/* Status dot */}
      {statusColor && (
        <circle
          cx="82"
          cy="90"
          r="6"
          fill={statusColor}
          stroke="#1A1A1A"
          strokeWidth="2"
        />
      )}
    </svg>
  );
});
MiiAvatar.displayName = "MiiAvatar";

/** Compact square avatar for use in lists / cards */
export function MiiAvatarCard({
  appearance,
  size = 64,
  statusColor,
  className,
}: MiiAvatarProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <MiiAvatar
        appearance={appearance}
        size={size * 1.1}
        statusColor={statusColor}
      />
    </div>
  );
}
