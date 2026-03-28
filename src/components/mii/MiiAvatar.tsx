/**
 * MiiAvatar — Redesigned parametric SVG character renderer (Mii-style)
 *
 * Canvas: 120×160 viewBox. Big round head, cute Mii proportions.
 * Head circle: cx=60 cy=50 r=34. Features placed accordingly.
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

// ─── Head Shape ───────────────────────────────────────────────────────────────
// Head circle anchor: cx=60 cy=50 r=34
function HeadShape({
  shape,
  skinColor,
}: {
  shape: MiiAppearance["faceShape"];
  skinColor: string;
}) {
  switch (shape) {
    case "oval":
      return <ellipse cx="60" cy="51" rx="33" ry="36" fill={skinColor} />;
    case "square":
      return <rect x="27" y="17" width="66" height="66" rx="20" fill={skinColor} />;
    case "heart":
      return (
        <path
          d="M60,84 C38,78 26,64 26,50 C26,34 38,16 60,16 C82,16 94,34 94,50 C94,64 82,78 60,84 Z"
          fill={skinColor}
        />
      );
    case "diamond":
      return <ellipse cx="60" cy="50" rx="29" ry="34" fill={skinColor} />;
    case "round":
    default:
      return <circle cx="60" cy="50" r="34" fill={skinColor} />;
  }
}

// ─── Hair Layer ───────────────────────────────────────────────────────────────
// Head circle reference: cx=60 cy=50 r=34
// Top of head: (60, 16). Hairline sides at approx (28, 38) / (92, 38).
function HairLayer({
  style,
  color,
}: {
  style: MiiAppearance["hairStyle"];
  color: string;
}) {
  // Shared cap path — covers top of head down to hairline
  const capPath =
    "M28,38 C26,28 38,16 60,16 C82,16 94,28 92,38 C88,20 76,8 60,8 C44,8 32,20 28,38 Z";

  switch (style) {
    case "bald":
      return null;

    case "short-straight":
      return <path d={capPath} fill={color} />;

    case "side-swept":
      return (
        <>
          <path
            d="M28,38 C26,28 38,16 60,16 C82,16 94,28 92,38 C88,20 76,8 60,8 C44,8 32,20 28,38 Z"
            fill={color}
          />
          {/* Side-swept bang curving left */}
          <path
            d="M28,38 C32,32 40,30 50,32 C46,28 42,22 38,22 C32,22 26,28 28,38 Z"
            fill={color}
            opacity="0.85"
          />
        </>
      );

    case "medium-wavy":
      return (
        <>
          <path
            d="M24,50 C24,27 38,12 60,12 C82,12 96,27 96,50 C92,30 80,6 60,6 C40,6 28,30 24,50 Z"
            fill={color}
          />
          {/* Wavy bangs */}
          <path
            d="M28,40 C32,36 38,38 42,43 C44,39 48,36 52,38 C54,35 58,33 60,35 C62,33 66,35 68,38 C72,36 76,39 78,43 C82,38 88,36 92,40"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );

    case "long-straight":
      return (
        <>
          <path
            d="M24,50 C24,27 38,12 60,12 C82,12 96,27 96,50 C92,30 80,6 60,6 C40,6 28,30 24,50 Z"
            fill={color}
          />
          {/* Left long side */}
          <path
            d="M24,50 C22,52 20,56 20,65 L20,125 C20,130 22,132 26,132 C28,132 30,130 30,127 L30,60 C30,54 28,50 24,50 Z"
            fill={color}
          />
          {/* Right long side */}
          <path
            d="M96,50 C98,52 100,56 100,65 L100,125 C100,130 98,132 94,132 C92,132 90,130 90,127 L90,60 C90,54 92,50 96,50 Z"
            fill={color}
          />
        </>
      );

    case "bob":
      return (
        <>
          <path
            d="M24,50 C24,27 38,12 60,12 C82,12 96,27 96,50 C92,30 80,6 60,6 C40,6 28,30 24,50 Z"
            fill={color}
          />
          {/* Bob sides */}
          <path
            d="M24,50 C22,52 20,56 20,65 L20,90 C20,94 22,96 26,96 Q60,100 94,96 C98,96 100,94 100,90 L100,65 C100,56 98,52 96,50 L90,50 L90,92 Q60,96 30,92 L30,50 Z"
            fill={color}
          />
        </>
      );

    case "mohawk":
      return (
        <>
          {/* Shaved sides — skin color drawn over hair */}
          {/* Mohawk strip */}
          <path
            d="M52,42 L48,28 L52,20 L56,10 L60,4 L64,10 L68,20 L72,28 L68,42 Z"
            fill={color}
          />
          <rect x="52" y="36" width="16" height="16" rx="4" fill={color} />
        </>
      );

    case "spiky":
      return (
        <>
          {/* Base cap */}
          <path d={capPath} fill={color} />
          {/* Spikes */}
          <polygon points="38,20 34,4 44,16" fill={color} />
          <polygon points="50,14 48,0 56,12" fill={color} />
          <polygon points="60,12 59,-2 67,10" fill={color} />
          <polygon points="70,14 72,0 78,12" fill={color} />
          <polygon points="82,20 86,4 76,16" fill={color} />
        </>
      );

    case "bun":
      return (
        <>
          {/* Hair cap */}
          <path d={capPath} fill={color} />
          {/* Bun on top */}
          <circle cx="60" cy="8" r="11" fill={color} />
          {/* Hair band */}
          <ellipse cx="60" cy="17" rx="10" ry="4" fill={color} opacity="0.6" />
        </>
      );

    case "ponytail":
      return (
        <>
          {/* Cap */}
          <path d={capPath} fill={color} />
          {/* Ponytail hanging from back */}
          <path
            d="M52,10 C50,16 50,22 52,34 C54,46 56,60 56,80 C56,100 58,110 60,112 C62,110 64,100 64,80 C64,60 66,46 68,34 C70,22 70,16 68,10 Z"
            fill={color}
          />
          {/* Hair tie */}
          <ellipse cx="60" cy="34" rx="8" ry="4" fill={color} opacity="0.7" />
        </>
      );

    case "pigtails":
      return (
        <>
          {/* Cap */}
          <path d={capPath} fill={color} />
          {/* Left pigtail */}
          <path
            d="M26,46 C20,46 16,50 16,60 L16,100 C16,106 18,110 22,112 C24,112 26,110 26,107 L26,62 Z"
            fill={color}
          />
          {/* Right pigtail */}
          <path
            d="M94,46 C100,46 104,50 104,60 L104,100 C104,106 102,110 98,112 C96,112 94,110 94,107 L94,62 Z"
            fill={color}
          />
          {/* Hair ties */}
          <circle cx="22" cy="60" r="5" fill={color} opacity="0.7" />
          <circle cx="98" cy="60" r="5" fill={color} opacity="0.7" />
        </>
      );

    case "curly":
      return (
        <>
          {/* Curly mass */}
          <ellipse cx="60" cy="28" rx="36" ry="22" fill={color} />
          {/* Individual curls on the sides */}
          <circle cx="28" cy="40" r="10" fill={color} />
          <circle cx="92" cy="40" r="10" fill={color} />
          <circle cx="36" cy="26" r="9" fill={color} />
          <circle cx="84" cy="26" r="9" fill={color} />
          <circle cx="60" cy="10" r="10" fill={color} />
        </>
      );

    case "afro":
      return (
        <ellipse cx="60" cy="28" rx="44" ry="34" fill={color} />
      );

    case "braids":
      return (
        <>
          {/* Cap */}
          <path d={capPath} fill={color} />
          {/* Left braid */}
          <path
            d="M26,46 C20,48 18,54 18,62 L18,110 C18,116 20,120 24,122 C26,122 28,120 28,117 L28,64 Z"
            fill={color}
          />
          {/* Right braid */}
          <path
            d="M94,46 C100,48 102,54 102,62 L102,110 C102,116 100,120 96,122 C94,122 92,120 92,117 L92,64 Z"
            fill={color}
          />
          {/* Braid segments left */}
          <line x1="19" y1="72" x2="27" y2="72" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <line x1="19" y1="84" x2="27" y2="84" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <line x1="19" y1="96" x2="27" y2="96" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <line x1="19" y1="108" x2="27" y2="108" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          {/* Braid segments right */}
          <line x1="93" y1="72" x2="101" y2="72" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <line x1="93" y1="84" x2="101" y2="84" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <line x1="93" y1="96" x2="101" y2="96" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <line x1="93" y1="108" x2="101" y2="108" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        </>
      );

    default:
      return <path d={capPath} fill={color} />;
  }
}

// ─── Eyes ─────────────────────────────────────────────────────────────────────
// Eyes centered at (46,50) left and (74,50) right
function Eyes({
  style,
  color,
}: {
  style: MiiAppearance["eyeStyle"];
  color: string;
}) {
  // Standard eye with sclera, iris, pupil, highlight
  const standardEye = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    tiltX = 0
  ) => (
    <g transform={tiltX !== 0 ? `translate(${tiltX},0)` : undefined}>
      {/* Sclera */}
      <ellipse cx={cx} cy={cy} rx={rx + 2.5} ry={ry + 2.5} fill="white" />
      {/* Iris */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} />
      {/* Pupil */}
      <ellipse cx={cx} cy={cy + 0.5} rx={rx * 0.45} ry={ry * 0.45} fill="#111" />
      {/* Highlight */}
      <circle cx={cx + rx * 0.35} cy={cy - ry * 0.35} r={rx * 0.28} fill="white" opacity="0.9" />
      {/* Small secondary highlight */}
      <circle cx={cx - rx * 0.2} cy={cy + ry * 0.25} r={rx * 0.15} fill="white" opacity="0.5" />
    </g>
  );

  switch (style) {
    case "round":
    default:
      return (
        <g>
          {standardEye(46, 50, 7, 7)}
          {standardEye(74, 50, 7, 7)}
        </g>
      );

    case "oval":
      return (
        <g>
          {standardEye(46, 50, 8, 6)}
          {standardEye(74, 50, 8, 6)}
        </g>
      );

    case "wide":
      return (
        <g>
          {standardEye(45, 50, 9, 9)}
          {standardEye(75, 50, 9, 9)}
        </g>
      );

    case "narrow":
      return (
        <g>
          {standardEye(46, 50, 9, 4.5)}
          {standardEye(74, 50, 9, 4.5)}
        </g>
      );

    case "star":
      return (
        <g>
          {/* Sclera */}
          <ellipse cx="46" cy="50" rx="9.5" ry="9.5" fill="white" />
          <ellipse cx="74" cy="50" rx="9.5" ry="9.5" fill="white" />
          {/* Star iris */}
          <path
            d="M46,42 L47.5,47 L53,47 L48.5,50.5 L50.5,56 L46,52.5 L41.5,56 L43.5,50.5 L39,47 L44.5,47 Z"
            fill={color}
          />
          <path
            d="M74,42 L75.5,47 L81,47 L76.5,50.5 L78.5,56 L74,52.5 L69.5,56 L71.5,50.5 L67,47 L72.5,47 Z"
            fill={color}
          />
          <circle cx="48" cy="47" r="2.5" fill="white" opacity="0.9" />
          <circle cx="76" cy="47" r="2.5" fill="white" opacity="0.9" />
        </g>
      );

    case "anime":
      return (
        <g>
          <ellipse cx="46" cy="50" rx="9" ry="11" fill="white" />
          <ellipse cx="74" cy="50" rx="9" ry="11" fill="white" />
          <ellipse cx="46" cy="51" rx="7" ry="8.5" fill={color} />
          <ellipse cx="74" cy="51" rx="7" ry="8.5" fill={color} />
          <ellipse cx="46" cy="52" rx="4" ry="5" fill="#111" />
          <ellipse cx="74" cy="52" rx="4" ry="5" fill="#111" />
          <circle cx="43" cy="47" r="3" fill="white" opacity="0.95" />
          <circle cx="71" cy="47" r="3" fill="white" opacity="0.95" />
          <circle cx="50" cy="53" r="1.5" fill="white" opacity="0.6" />
          <circle cx="78" cy="53" r="1.5" fill="white" opacity="0.6" />
        </g>
      );
  }
}

// ─── Eyebrows ─────────────────────────────────────────────────────────────────
// Eyebrows at y≈42, over eyes at (46,50) and (74,50)
function Eyebrows({
  style,
  color,
}: {
  style: MiiAppearance["eyebrowStyle"];
  color: string;
}) {
  const base = {
    stroke: color,
    strokeLinecap: "round" as const,
    fill: "none",
  };

  switch (style) {
    case "thick":
      return (
        <g>
          <path d="M34,42 Q46,38 58,42" {...base} strokeWidth="4.5" />
          <path d="M62,42 Q74,38 86,42" {...base} strokeWidth="4.5" />
        </g>
      );
    case "thin":
      return (
        <g>
          <path d="M35,42 Q46,39 57,42" {...base} strokeWidth="2" />
          <path d="M63,42 Q74,39 85,42" {...base} strokeWidth="2" />
        </g>
      );
    case "arched":
      return (
        <g>
          <path d="M33,44 Q46,36 59,42" {...base} strokeWidth="3" />
          <path d="M61,42 Q74,36 87,44" {...base} strokeWidth="3" />
        </g>
      );
    case "worried":
      return (
        <g>
          <path d="M33,41 Q46,44 59,41" {...base} strokeWidth="3" />
          <path d="M61,41 Q74,44 87,41" {...base} strokeWidth="3" />
        </g>
      );
    case "angry":
      return (
        <g>
          <path d="M34,43 Q46,39 58,42" {...base} strokeWidth="4" />
          <path d="M62,42 Q74,39 86,43" {...base} strokeWidth="4" />
        </g>
      );
    case "raised":
      return (
        <g>
          <path d="M34,39 Q46,36 58,39" {...base} strokeWidth="3" />
          <path d="M62,39 Q74,36 86,39" {...base} strokeWidth="3" />
        </g>
      );
    case "normal":
    default:
      return (
        <g>
          <path d="M34,42 Q46,39 58,42" {...base} strokeWidth="3" />
          <path d="M62,42 Q74,39 86,42" {...base} strokeWidth="3" />
        </g>
      );
  }
}

// ─── Nose ─────────────────────────────────────────────────────────────────────
function Nose({ size, skinColor }: { size: 0 | 1 | 2; skinColor: string }) {
  const shadow = skinColor + "90";
  if (size === 0) return null;
  if (size === 1) {
    return <ellipse cx="60" cy="62" rx="3.5" ry="2.5" fill={shadow} />;
  }
  return (
    <g>
      <ellipse cx="54" cy="63" rx="3" ry="2.5" fill={shadow} />
      <ellipse cx="66" cy="63" rx="3" ry="2.5" fill={shadow} />
      <path
        d="M54,61 Q60,56 66,61"
        stroke={shadow}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

// ─── Mouth ────────────────────────────────────────────────────────────────────
function Mouth({ style }: { style: MiiAppearance["mouthStyle"] }) {
  switch (style) {
    case "big-smile":
      return (
        <g>
          <path
            d="M38,70 Q60,84 82,70"
            stroke="#C0392B"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M38,70 Q60,86 82,70 Q60,80 38,70 Z"
            fill="#E74C3C"
            opacity="0.7"
          />
        </g>
      );
    case "neutral":
      return (
        <path
          d="M42,72 L78,72"
          stroke="#A0522D"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      );
    case "smirk":
      return (
        <path
          d="M42,72 Q60,80 78,70"
          stroke="#C0392B"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      );
    case "open-happy":
      return (
        <g>
          <path
            d="M40,70 Q60,86 80,70"
            stroke="#C0392B"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M40,70 Q60,86 80,70 Q80,76 60,77 Q40,76 40,70 Z"
            fill="#E74C3C"
          />
          <ellipse cx="60" cy="80" rx="10" ry="4" fill="#FADADD" />
        </g>
      );
    case "slight-frown":
      return (
        <path
          d="M42,74 Q60,68 78,74"
          stroke="#A0522D"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      );
    case "smile":
    default:
      return (
        <path
          d="M40,70 Q60,82 80,70"
          stroke="#C0392B"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      );
  }
}

// ─── Blush ────────────────────────────────────────────────────────────────────
function Blush({ level }: { level: 0 | 1 | 2 }) {
  if (level === 0) return null;
  const opacity = level === 1 ? 0.22 : 0.42;
  return (
    <g>
      <ellipse cx="31" cy="60" rx="10" ry="7" fill="#FF6B8A" opacity={opacity} />
      <ellipse cx="89" cy="60" rx="10" ry="7" fill="#FF6B8A" opacity={opacity} />
    </g>
  );
}

// ─── Facial Hair ──────────────────────────────────────────────────────────────
function FacialHair({ level, color }: { level: 0 | 1 | 2 | 3; color: string }) {
  if (level === 0) return null;
  if (level === 1) {
    return (
      <g opacity="0.45">
        {([38, 44, 50, 56, 62, 68, 74, 80] as const).map((x, i) =>
          ([78, 81, 84] as const).map((y, j) => (
            <circle key={`${i}-${j}`} cx={x} cy={y} r={0.9} fill={color} />
          ))
        )}
      </g>
    );
  }
  if (level === 2) {
    return (
      <path
        d="M28,68 Q32,86 42,92 Q60,99 78,92 Q88,86 92,68 Q76,82 60,83 Q44,82 28,68 Z"
        fill={color}
        opacity="0.85"
      />
    );
  }
  return (
    <path
      d="M40,68 Q48,76 60,74 Q72,76 80,68 Q72,73 60,71 Q48,73 40,68 Z"
      fill={color}
      opacity="0.9"
    />
  );
}

// ─── Accessories ──────────────────────────────────────────────────────────────
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
        <g fill="none" stroke={color} strokeWidth="2.2">
          <circle cx="46" cy="50" r="11" />
          <circle cx="74" cy="50" r="11" />
          <line x1="57" y1="50" x2="63" y2="50" />
          <line x1="20" y1="48" x2="35" y2="50" />
          <line x1="85" y1="50" x2="100" y2="48" />
        </g>
      );

    case "sunglasses":
      return (
        <g>
          <rect x="32" y="43" width="28" height="16" rx="8" fill={color} opacity="0.88" />
          <rect x="60" y="43" width="28" height="16" rx="8" fill={color} opacity="0.88" />
          <line x1="57" y1="51" x2="63" y2="51" stroke={color} strokeWidth="2.5" />
          <line x1="20" y1="48" x2="32" y2="50" stroke={color} strokeWidth="2.5" />
          <line x1="88" y1="50" x2="100" y2="48" stroke={color} strokeWidth="2.5" />
          {/* Lens shine */}
          <path d="M36,45 Q40,44 44,46" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
          <path d="M64,45 Q68,44 72,46" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
        </g>
      );

    case "hat-cap":
      return (
        <g>
          {/* Brim */}
          <path d="M22,30 Q60,36 98,30 Q98,36 22,36 Z" fill={color} />
          {/* Cap body */}
          <path
            d="M24,36 C24,20 36,8 60,8 C84,8 96,20 96,36 Z"
            fill={color}
          />
          {/* Button on top */}
          <circle cx="60" cy="8" r="4" fill={color} opacity="0.75" />
          {/* Highlight */}
          <path d="M36,12 Q60,8 84,12" stroke="white" strokeWidth="1.5" fill="none" opacity="0.18" strokeLinecap="round" />
        </g>
      );

    case "hat-beanie":
      return (
        <g>
          <path
            d="M24,40 C24,22 36,6 60,6 C84,6 96,22 96,40 L94,35 C90,16 76,4 60,4 C44,4 30,16 26,35 Z"
            fill={color}
          />
          {/* Cuff */}
          <path d="M22,40 Q60,48 98,40 Q98,46 60,50 Q22,46 22,40 Z" fill={color} opacity="0.75" />
          {/* Pom */}
          <circle cx="60" cy="5" r="6" fill={color} />
        </g>
      );

    case "headband":
      return (
        <path
          d="M26,34 Q60,30 94,34 Q94,42 60,44 Q26,42 26,34 Z"
          fill={color}
          opacity="0.88"
        />
      );

    case "earrings":
      return (
        <g>
          <circle cx="20" cy="56" r="4" fill={color} />
          <circle cx="100" cy="56" r="4" fill={color} />
        </g>
      );

    case "helmet":
      return (
        <g>
          <path
            d="M18,50 C18,24 36,4 60,4 C84,4 102,24 102,50 L100,38 C98,16 82,0 60,0 C38,0 22,16 20,38 Z"
            fill={color}
          />
          {/* Chin strap */}
          <path d="M22,52 Q60,62 98,52 Q98,56 60,60 Q22,56 22,52 Z" fill={color} opacity="0.88" />
          {/* Visor */}
          <path d="M26,36 Q60,38 94,36 Q94,50 60,52 Q26,50 26,36 Z" fill="#4A90E2" opacity="0.5" />
          {/* Helmet shine */}
          <path d="M32,8 Q60,4 88,8" stroke="white" strokeWidth="2" fill="none" opacity="0.2" strokeLinecap="round" />
        </g>
      );

    case "none":
    default:
      return null;
  }
}

// ─── Body / Shirt ─────────────────────────────────────────────────────────────
// Body starts below neck at y≈102
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
            d="M28,102 Q60,116 92,102 L100,158 L20,158 Z"
            fill={color}
          />
          {/* Collar */}
          <path d="M46,102 L60,116 L74,102 L66,106 L60,108 L54,106 Z" fill="white" />
        </g>
      );
    case "hoodie":
      return (
        <g>
          <path d="M28,102 Q60,116 92,102 L100,158 L20,158 Z" fill={color} />
          {/* Hood shape */}
          <path
            d="M40,102 Q60,120 80,102 Q80,110 68,114 Q60,116 52,114 Q40,110 40,102 Z"
            fill={color}
            opacity="0.7"
          />
          {/* Pocket */}
          <rect x="48" y="124" width="24" height="16" rx="6" fill={color} opacity="0.5" />
          {/* Arms */}
          <path d="M28,102 Q22,112 20,130" stroke={color} strokeWidth="16" strokeLinecap="round" fill="none" />
          <path d="M92,102 Q98,112 100,130" stroke={color} strokeWidth="16" strokeLinecap="round" fill="none" />
        </g>
      );
    case "tank":
      return (
        <g>
          <path d="M34,102 Q60,114 86,102 L94,158 L26,158 Z" fill={color} />
          {/* Straps */}
          <path d="M34,102 Q30,112 26,128" stroke={color} strokeWidth="12" strokeLinecap="round" fill="none" />
          <path d="M86,102 Q90,112 94,128" stroke={color} strokeWidth="12" strokeLinecap="round" fill="none" />
        </g>
      );
    case "turtleneck":
      return (
        <g>
          <path d="M28,102 Q60,116 92,102 L100,158 L20,158 Z" fill={color} />
          {/* Turtleneck collar */}
          <rect x="42" y="88" width="36" height="18" rx="8" fill={color} />
          {/* Arms */}
          <path d="M28,102 Q22,112 20,130" stroke={color} strokeWidth="16" strokeLinecap="round" fill="none" />
          <path d="M92,102 Q98,112 100,130" stroke={color} strokeWidth="16" strokeLinecap="round" fill="none" />
        </g>
      );
    case "plain":
    default:
      return (
        <g>
          <path d="M28,102 Q60,116 92,102 L100,158 L20,158 Z" fill={color} />
          {/* Arms */}
          <path d="M28,102 Q22,112 20,130" stroke={color} strokeWidth="16" strokeLinecap="round" fill="none" />
          <path d="M92,102 Q98,112 100,130" stroke={color} strokeWidth="16" strokeLinecap="round" fill="none" />
          {/* Subtle highlight */}
          <path d="M40,104 Q60,112 80,104" stroke="white" strokeWidth="1.5" fill="none" opacity="0.15" strokeLinecap="round" />
        </g>
      );
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export const MiiAvatar = React.forwardRef<SVGSVGElement, MiiAvatarProps>(
  function MiiAvatar(
    { appearance, size = 100, statusColor, className }: MiiAvatarProps,
    ref
  ) {
    const skinColor = SKIN_TONE_COLORS[appearance.skinTone];
    const hairColor = HAIR_COLOR_VALUES[appearance.hairColor];
    const eyeColor = EYE_COLOR_VALUES[appearance.eyeColor];
    const eyebrowColor = HAIR_COLOR_VALUES[appearance.eyebrowColor];
    const facialHairColor = HAIR_COLOR_VALUES[appearance.facialHairColor];

    // Subtle skin shadow for depth
    const skinShadow = skinColor + "60";

    return (
      <svg
        ref={ref}
        width={size}
        height={Math.round(size * (160 / 120))}
        viewBox="0 0 120 160"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ display: "block" }}
      >
        {/* Body / Shirt */}
        <Body
          style={appearance.shirtStyle}
          color={appearance.shirtColor}
          skinColor={skinColor}
        />

        {/* Neck */}
        <rect x="51" y="83" width="18" height="22" rx="7" fill={skinColor} />
        {/* Neck shadow */}
        <rect x="51" y="83" width="18" height="6" rx="4" fill={skinShadow} />

        {/* Ears (behind head) */}
        <ellipse cx="26" cy="52" rx="6" ry="9" fill={skinColor} />
        <ellipse cx="94" cy="52" rx="6" ry="9" fill={skinColor} />
        {/* Inner ear */}
        <ellipse cx="26" cy="52" rx="3.5" ry="5.5" fill={skinShadow} />
        <ellipse cx="94" cy="52" rx="3.5" ry="5.5" fill={skinShadow} />

        {/* Head (face) */}
        <HeadShape shape={appearance.faceShape} skinColor={skinColor} />

        {/* Head highlight */}
        <ellipse cx="46" cy="28" rx="14" ry="10" fill="white" opacity="0.08" />

        {/* Hair (behind face features, on top of head) */}
        <HairLayer style={appearance.hairStyle} color={hairColor} />

        {/* Blush */}
        <Blush level={appearance.blush} />

        {/* Nose */}
        <Nose size={appearance.noseSize} skinColor={skinColor} />

        {/* Eyes */}
        <Eyes style={appearance.eyeStyle} color={eyeColor} />

        {/* Eyebrows */}
        <Eyebrows style={appearance.eyebrowStyle} color={eyebrowColor} />

        {/* Mouth */}
        <Mouth style={appearance.mouthStyle} />

        {/* Facial Hair */}
        <FacialHair level={appearance.facialHair} color={facialHairColor} />

        {/* Accessory (topmost) */}
        <Accessory type={appearance.accessory} color={appearance.accessoryColor} />

        {/* Status dot */}
        {statusColor && (
          <circle
            cx="96"
            cy="140"
            r="7"
            fill={statusColor}
            stroke="#1A1A1A"
            strokeWidth="2.5"
          />
        )}
      </svg>
    );
  }
);
MiiAvatar.displayName = "MiiAvatar";

/** Compact circular avatar for use in lists / cards */
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
