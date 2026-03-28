import { NextResponse } from "next/server";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { discoverAgents, readOpenClawConfig } from "@/lib/openclaw-discovery";
import { OPENCLAW_DIR } from "@/lib/paths";

export const dynamic = "force-dynamic";

interface OpenClawConfig {
  channels?: {
    telegram?: {
      dmPolicy?: string;
      accounts?: Record<string, { botToken?: string; dmPolicy?: string }>;
    };
  };
}

interface StoredSession {
  sessionId?: string;
  updatedAt?: number;
  chatType?: string;
  model?: string;
  lastChannel?: string;
  deliveryContext?: {
    channel?: string;
  };
  origin?: {
    provider?: string;
    surface?: string;
    chatType?: string;
  };
  sessionFile?: string;
}

function readRecentMemoryFiles(workspace: string): Array<{ date: string; size: number; modified: string }> {
  const memoryPath = join(workspace, "memory");

  if (!existsSync(memoryPath)) {
    return [];
  }

  try {
    return readdirSync(memoryPath)
      .filter((file) => file.match(/^\d{4}-\d{2}-\d{2}\.md$/))
      .map((file) => {
        const stat = statSync(join(memoryPath, file));

        return {
          date: file.replace(".md", ""),
          size: stat.size,
          modified: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
  } catch {
    return [];
  }
}

function readSessionDetails(agentId: string) {
  const sessionsPath = join(OPENCLAW_DIR, "agents", agentId, "sessions", "sessions.json");

  if (!existsSync(sessionsPath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(readFileSync(sessionsPath, "utf-8")) as Record<string, StoredSession>;

    return Object.entries(parsed)
      .map(([key, session]) => ({
        key,
        sessionId: session.sessionId || key,
        updatedAt: session.updatedAt ? new Date(session.updatedAt).toISOString() : undefined,
        channel: session.deliveryContext?.channel || session.lastChannel || "unknown",
        provider: session.origin?.provider || session.origin?.surface || "unknown",
        chatType: session.chatType || session.origin?.chatType || "unknown",
        model: session.model,
        sessionFile: session.sessionFile,
      }))
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
      .slice(0, 10);
  } catch {
    return [];
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const config = readOpenClawConfig() as OpenClawConfig | null;
    const agent = discoverAgents().find((entry) => entry.id === id);

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const telegramAccount = config?.channels?.telegram?.accounts?.[id];
    const sessions = readSessionDetails(id);
    const recentFiles = readRecentMemoryFiles(agent.workspace);

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        emoji: agent.emoji,
        color: agent.color,
        model: agent.model,
        workspace: agent.workspace,
        source: agent.source,
        dmPolicy: telegramAccount?.dmPolicy || config?.channels?.telegram?.dmPolicy || "pairing",
        allowAgents: [],
        telegramConfigured: !!telegramAccount?.botToken,
      },
      memory: {
        recentFiles,
      },
      sessions,
    });
  } catch (error) {
    console.error("Error getting agent status:", error);
    return NextResponse.json(
      { error: "Failed to get agent status" },
      { status: 500 }
    );
  }
}
