import { NextResponse } from "next/server";
import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { BRANDING } from "@/config/branding";
import { OPENCLAW_CONFIG, OPENCLAW_WORKSPACE } from "@/lib/paths";

export const dynamic = "force-dynamic";

interface Agent {
  id: string;
  name?: string;
  emoji: string;
  color: string;
  model: string;
  workspace: string;
  dmPolicy?: string;
  allowAgents?: string[];
  allowAgentsDetails?: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
  botToken?: string;
  status: "online" | "offline";
  lastActivity?: string;
  activeSessions: number;
}

interface AgentConfig {
  id: string;
  name?: string;
  workspace: string;
  model?: {
    primary?: string;
  };
  subagents?: {
    allowAgents?: string[];
  };
  ui?: {
    emoji?: string;
    color?: string;
  };
}

interface OpenClawConfig {
  agents?: {
    list?: AgentConfig[];
    defaults?: {
      model?: {
        primary?: string;
      };
    };
  };
  channels?: {
    telegram?: {
      dmPolicy?: string;
      accounts?: Record<string, { botToken?: string; dmPolicy?: string }>;
    };
  };
}

const DEFAULT_AGENT_CONFIG: Record<string, { emoji: string; color: string; name?: string }> = {
  main: {
    emoji: BRANDING.agentEmoji,
    color: "#ff6b35",
    name: BRANDING.agentName,
  },
};

function getAgentDisplayInfo(agentId: string, agentConfig?: AgentConfig): { emoji: string; color: string; name: string } {
  const defaults = DEFAULT_AGENT_CONFIG[agentId];

  return {
    emoji: agentConfig?.ui?.emoji || defaults?.emoji || "🤖",
    color: agentConfig?.ui?.color || defaults?.color || "#666666",
    name: agentConfig?.name || defaults?.name || agentId,
  };
}

function getAgentStatus(workspace: string): { lastActivity?: string; status: "online" | "offline" } {
  try {
    const today = new Date().toISOString().split("T")[0];
    const memoryFile = join(workspace, "memory", `${today}.md`);
    const stat = statSync(memoryFile);
    return {
      lastActivity: stat.mtime.toISOString(),
      status: Date.now() - stat.mtime.getTime() < 5 * 60 * 1000 ? "online" : "offline",
    };
  } catch {
    return { status: "offline" };
  }
}

function buildFallbackAgents(config: OpenClawConfig | null): Agent[] {
  const mainInfo = getAgentDisplayInfo("main");
  const mainStatus = getAgentStatus(OPENCLAW_WORKSPACE);

  return [
    {
      id: "main",
      name: mainInfo.name,
      emoji: mainInfo.emoji,
      color: mainInfo.color,
      model: config?.agents?.defaults?.model?.primary || "unknown",
      workspace: OPENCLAW_WORKSPACE,
      dmPolicy: config?.channels?.telegram?.dmPolicy || "pairing",
      allowAgents: [],
      allowAgentsDetails: [],
      botToken: undefined,
      status: mainStatus.status,
      lastActivity: mainStatus.lastActivity,
      activeSessions: 0,
    },
  ];
}

export async function GET() {
  try {
    const config: OpenClawConfig | null = existsSync(OPENCLAW_CONFIG)
      ? JSON.parse(readFileSync(OPENCLAW_CONFIG, "utf-8"))
      : null;

    const configuredAgents = config?.agents?.list ?? [];

    if (configuredAgents.length === 0) {
      return NextResponse.json({ agents: buildFallbackAgents(config) });
    }

    const agents: Agent[] = configuredAgents.map((agent) => {
      const agentInfo = getAgentDisplayInfo(agent.id, agent);
      const telegramAccount = config?.channels?.telegram?.accounts?.[agent.id];
      const statusInfo = getAgentStatus(agent.workspace);
      const allowAgents = agent.subagents?.allowAgents || [];
      const allowAgentsDetails = allowAgents.map((subagentId) => {
        const subagentConfig = configuredAgents.find((candidate) => candidate.id === subagentId);
        const subagentInfo = getAgentDisplayInfo(subagentId, subagentConfig);

        return {
          id: subagentId,
          name: subagentInfo.name,
          emoji: subagentInfo.emoji,
          color: subagentInfo.color,
        };
      });

      return {
        id: agent.id,
        name: agentInfo.name,
        emoji: agentInfo.emoji,
        color: agentInfo.color,
        model: agent.model?.primary || config?.agents?.defaults?.model?.primary || "unknown",
        workspace: agent.workspace,
        dmPolicy: telegramAccount?.dmPolicy || config?.channels?.telegram?.dmPolicy || "pairing",
        allowAgents,
        allowAgentsDetails,
        botToken: telegramAccount?.botToken ? "configured" : undefined,
        status: statusInfo.status,
        lastActivity: statusInfo.lastActivity,
        activeSessions: 0,
      };
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error reading agents:", error);
    return NextResponse.json(
      { error: "Failed to load agents" },
      { status: 500 }
    );
  }
}
