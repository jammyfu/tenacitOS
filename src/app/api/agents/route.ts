import { NextResponse } from "next/server";
import { statSync } from "fs";
import { join } from "path";
import { discoverAgents, readAgentSessionSummary, readOpenClawConfig } from "@/lib/openclaw-discovery";

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

interface OpenClawConfig {
  channels?: {
    telegram?: {
      dmPolicy?: string;
      accounts?: Record<string, { botToken?: string; dmPolicy?: string }>;
    };
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

export async function GET() {
  try {
    const config = readOpenClawConfig() as OpenClawConfig | null;
    const discoveredAgents = discoverAgents();

    const agents: Agent[] = discoveredAgents.map((agent) => {
      const telegramAccount = config?.channels?.telegram?.accounts?.[agent.id];
      const statusInfo = getAgentStatus(agent.workspace);
      const sessionInfo = readAgentSessionSummary(agent.id);

      return {
        id: agent.id,
        name: agent.name,
        emoji: agent.emoji,
        color: agent.color,
        model: agent.model,
        workspace: agent.workspace,
        dmPolicy: telegramAccount?.dmPolicy || config?.channels?.telegram?.dmPolicy || "pairing",
        allowAgents: [],
        allowAgentsDetails: [],
        botToken: telegramAccount?.botToken ? "configured" : undefined,
        status: statusInfo.status,
        lastActivity: statusInfo.lastActivity || sessionInfo.updatedAt,
        activeSessions: sessionInfo.activeSessions,
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
