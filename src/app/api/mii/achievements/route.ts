/**
 * GET /api/mii/achievements
 *
 * Auto-detects and returns unlocked achievements based on current character data.
 * Returns an array of Achievement objects with unlockedBy and unlockedAt set.
 */

import { NextResponse } from "next/server";
import { readCharacters } from "@/lib/mii-storage";
import {
  ACHIEVEMENT_DEFINITIONS,
  type Achievement,
  type AchievementId,
  type MiiCharacter,
} from "@/lib/mii-types";

export const dynamic = "force-dynamic";

function checkAchievements(characters: MiiCharacter[]): Achievement[] {
  const now = new Date().toISOString();
  const results: Achievement[] = [];

  const allRoles = new Set([
    "工程师", "指挥官", "侦察员", "守卫", "分析师",
    "设计师", "协调员", "研究员", "测试员", "部署员", "探索者",
  ]);
  const allPersonalities = new Set([
    "严肃", "活泼", "冷静", "热情", "谨慎", "大胆",
    "友善", "独立", "协作", "创意", "精准", "领导力", "团队协作",
  ]);

  const teamRoles = new Set(characters.map((c) => c.role));
  const teamPersonalities = new Set(characters.flatMap((c) => c.personality));
  const onlineChars = characters.filter((c) => c.status === "online");

  const achievementChecks: Record<AchievementId, () => string[]> = {
    first_character: () => (characters.length >= 1 ? [characters[0].id] : []),

    five_characters: () =>
      characters.length >= 5 ? characters.slice(0, 5).map((c) => c.id) : [],

    ten_characters: () =>
      characters.length >= 10 ? characters.map((c) => c.id) : [],

    perfect_stat: () =>
      characters
        .filter((c) => Object.values(c.stats).some((v) => v >= 100))
        .map((c) => c.id),

    all_stats_maxed: () =>
      characters
        .filter((c) => Object.values(c.stats).every((v) => v >= 100))
        .map((c) => c.id),

    full_team: () =>
      onlineChars.length >= 5 ? onlineChars.map((c) => c.id) : [],

    all_roles: () => {
      const covered = [...allRoles].every((r) => teamRoles.has(r as never));
      return covered ? characters.map((c) => c.id) : [];
    },

    all_personalities: () => {
      const covered = [...allPersonalities].every((p) => teamPersonalities.has(p as never));
      return covered ? characters.map((c) => c.id) : [];
    },

    online_hero: () =>
      characters.filter((c) => c.status === "online").map((c) => c.id),

    stat_total_500: () =>
      characters
        .filter((c) => Object.values(c.stats).reduce((s, v) => s + v, 0) > 500)
        .map((c) => c.id),
  };

  for (const [id, check] of Object.entries(achievementChecks) as [AchievementId, () => string[]][]) {
    const unlocked = check();
    if (unlocked.length > 0) {
      const def = ACHIEVEMENT_DEFINITIONS[id];
      results.push({
        ...def,
        unlockedBy: unlocked,
        unlockedAt: now,
      });
    }
  }

  return results;
}

export async function GET() {
  const characters = readCharacters();
  const achievements = checkAchievements(characters);

  const stats = {
    total: Object.keys(ACHIEVEMENT_DEFINITIONS).length,
    unlocked: achievements.length,
    locked: Object.keys(ACHIEVEMENT_DEFINITIONS).length - achievements.length,
  };

  // Build locked achievements too (for display)
  const locked: Achievement[] = (Object.keys(ACHIEVEMENT_DEFINITIONS) as AchievementId[])
    .filter((id) => !achievements.some((a) => a.id === id))
    .map((id) => ({
      ...ACHIEVEMENT_DEFINITIONS[id],
      unlockedBy: [],
    }));

  return NextResponse.json({ achievements, locked, stats });
}
