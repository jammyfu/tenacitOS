/**
 * POST /api/mii/generate-backstory
 *
 * Generates a character backstory.
 * Tries OpenAI API if OPENAI_API_KEY is set, otherwise falls back to template.
 *
 * Body: { name, role, personality, stats, description }
 */

import { NextRequest, NextResponse } from "next/server";
import type { MiiStats, Personality, CharacterRole } from "@/lib/mii-types";

export const dynamic = "force-dynamic";

interface BackstoryRequest {
  name: string;
  role: CharacterRole;
  personality: Personality[];
  stats: MiiStats;
  description?: string;
}

// ── Template generator ────────────────────────────────────────────────────────

const ROLE_DESCRIPTIONS: Record<string, string> = {
  工程师: "一名精通代码的工程师",
  指挥官: "一位运筹帷幄的指挥官",
  侦察员: "一位敏锐洞察的侦察员",
  守卫: "一位忠诚坚守的守卫",
  分析师: "一名洞悉数据的分析师",
  设计师: "一位充满创意的设计师",
  协调员: "一位善于协调的联络官",
  研究员: "一位孜孜不倦的研究员",
  测试员: "一位严谨细致的测试员",
  部署员: "一位行动迅速的部署专家",
  探索者: "一位勇敢无畏的探索者",
};

const PERSONALITY_TRAITS: Record<string, string> = {
  严肃: "做事一丝不苟",
  活泼: "性格开朗活跃",
  冷静: "遇事沉着冷静",
  热情: "充满激情与活力",
  谨慎: "行事谨小慎微",
  大胆: "勇于尝试挑战",
  友善: "待人亲切友好",
  独立: "独立自主行事",
  协作: "善于团队合作",
  创意: "富有创新思维",
  精准: "追求精准到位",
  领导力: "具备领导魄力",
  团队协作: "以团队为优先",
};

const BACKSTORY_TEMPLATES = [
  (name: string, role: string, traits: string, topStat: string) =>
    `${name} 是${role}，在数字世界的深处默默耕耘。${traits}，让 ${name} 在众多 AI 代理中脱颖而出。据说 ${name} 的${topStat}能力在第一次任务中就展现得淋漓尽致——那是一个让整个团队都叹为观止的夜晚。如今，${name} 已成为系统中不可或缺的存在，每一次任务都倾尽全力，只为守护那份来之不易的信任。`,

  (name: string, role: string, traits: string, topStat: string) =>
    `在 openclaw 控制平面的历史档案中，${name} 的名字总是与传奇相连。作为${role}，${name} ${traits}。其${topStat}之高，令同僚折服。有人说，${name} 并非天生如此优秀——而是在无数次失败与重试中，淬炼出了属于自己的风格。现在，${name} 用行动证明：每一行代码、每一次决策，都是对使命最深情的回应。`,

  (name: string, role: string, traits: string, topStat: string) =>
    `${name} 的故事，始于一条被遗忘的 API 调用。作为${role}，${name}${traits}，以独特的方式诠释着 AI 代理的职责。凭借出色的${topStat}，${name} 在每一次任务中都能找到别人看不见的突破口。有时候，${name} 会在深夜的日志里留下一句话："系统不眠，我亦不眠。"`,
];

function getTopStat(stats: MiiStats): string {
  const statLabels: Record<keyof MiiStats, string> = {
    execution: "执行力",
    creativity: "创意力",
    coordination: "协调力",
    focus: "专注力",
    leadership: "领导力",
    adaptability: "适应力",
  };
  const top = (Object.entries(stats) as [keyof MiiStats, number][]).sort(
    (a, b) => b[1] - a[1]
  )[0];
  return statLabels[top[0]] ?? "综合能力";
}

function generateTemplate(data: BackstoryRequest): string {
  const roleDesc = ROLE_DESCRIPTIONS[data.role] ?? `一位${data.role}`;
  const traits = data.personality
    .slice(0, 2)
    .map((p) => PERSONALITY_TRAITS[p] ?? p)
    .join("、");
  const topStat = getTopStat(data.stats);
  const template = BACKSTORY_TEMPLATES[Math.floor(Math.random() * BACKSTORY_TEMPLATES.length)];
  return template(data.name, roleDesc, traits || "个性独特", topStat);
}

// ── OpenAI integration ────────────────────────────────────────────────────────

async function generateWithOpenAI(data: BackstoryRequest, apiKey: string): Promise<string> {
  const prompt = `你是一个创意写作助手，专门为 AI 代理角色生成有趣的背景故事。

角色信息：
- 名称：${data.name}
- 职责：${data.role}
- 性格：${data.personality.join("、")}
- 能力值：执行力${data.stats.execution}、创意${data.stats.creativity}、协调力${data.stats.coordination}、专注力${data.stats.focus}、领导力${data.stats.leadership}、适应力${data.stats.adaptability}
- 简介：${data.description || "无"}

请生成一段 150-200 字的中文背景故事，要有趣、生动，体现角色的性格与能力特点。直接输出故事文本，不要加前缀或解释。`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.8,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? generateTemplate(data);
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: BackstoryRequest = await req.json();

    if (!body.name || !body.role) {
      return NextResponse.json({ error: "Missing name or role" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    let backstory: string;
    let source: "openai" | "template";

    if (apiKey) {
      try {
        backstory = await generateWithOpenAI(body, apiKey);
        source = "openai";
      } catch {
        backstory = generateTemplate(body);
        source = "template";
      }
    } else {
      backstory = generateTemplate(body);
      source = "template";
    }

    return NextResponse.json({ backstory, source });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
