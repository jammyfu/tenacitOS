/**
 * MiiRadarChart — pure-SVG hexagonal radar chart for Mii stats
 *
 * Renders a 6-axis hexagonal radar with labeled axes.
 * Fill color is derived from the character's hair color.
 */

import React from "react";
import type { MiiStats } from "@/lib/mii-types";

const AXES = [
  { key: "execution", label: "执行力" },
  { key: "creativity", label: "创造力" },
  { key: "coordination", label: "协调力" },
  { key: "focus", label: "专注度" },
  { key: "leadership", label: "领导力" },
  { key: "adaptability", label: "适应力" },
] as const;

const N = AXES.length; // 6
const TWO_PI = Math.PI * 2;
const START_ANGLE = -Math.PI / 2; // top

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

interface MiiRadarChartProps {
  stats: MiiStats;
  /** hex color for fill, defaults to #3B82F6 */
  accentColor?: string;
  size?: number;
  /** show axis labels */
  showLabels?: boolean;
}

export function MiiRadarChart({
  stats,
  accentColor = "#3B82F6",
  size = 160,
  showLabels = true,
}: MiiRadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const labelR = size * 0.48;

  // Grid levels: 25, 50, 75, 100
  const levels = [0.25, 0.5, 0.75, 1.0];

  // Compute axis endpoints
  const axisPoints = AXES.map((_, i) => {
    const angle = START_ANGLE + (TWO_PI * i) / N;
    return polarToXY(angle, maxR, cx, cy);
  });

  // Compute data polygon
  const dataPoints = AXES.map(({ key }, i) => {
    const value = (stats as unknown as Record<string, number>)[key] ?? 0;
    const r = maxR * (value / 100);
    const angle = START_ANGLE + (TWO_PI * i) / N;
    return polarToXY(angle, r, cx, cy);
  });

  const dataPath = dataPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ") + " Z";

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ overflow: "visible" }}
    >
      {/* Grid polygons */}
      {levels.map((level) => {
        const pts = AXES.map((_, i) => {
          const angle = START_ANGLE + (TWO_PI * i) / N;
          const p = polarToXY(angle, maxR * level, cx, cy);
          return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={0.8}
          />
        );
      })}

      {/* Axis lines */}
      {axisPoints.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p.x.toFixed(2)}
          y2={p.y.toFixed(2)}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={0.8}
        />
      ))}

      {/* Data fill */}
      <path
        d={dataPath}
        fill={accentColor + "44"}
        stroke={accentColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x.toFixed(2)}
          cy={p.y.toFixed(2)}
          r={2.5}
          fill={accentColor}
        />
      ))}

      {/* Labels */}
      {showLabels &&
        AXES.map(({ label }, i) => {
          const angle = START_ANGLE + (TWO_PI * i) / N;
          const lp = polarToXY(angle, labelR, cx, cy);
          const textAnchor =
            Math.abs(lp.x - cx) < 4
              ? "middle"
              : lp.x < cx
                ? "end"
                : "start";
          return (
            <text
              key={label}
              x={lp.x.toFixed(2)}
              y={lp.y.toFixed(2)}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              fontSize={8.5}
              fill="rgba(255,255,255,0.55)"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            >
              {label}
            </text>
          );
        })}
    </svg>
  );
}
