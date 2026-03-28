import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { OPENCLAW_CONFIG, OPENCLAW_DIR, OPENCLAW_WORKSPACE } from "./paths";
import { readWorkspaceIdentity } from "./workspace-identity";

export interface DiscoveredAgent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  workspace: string;
  model: string;
  source: "config" | "agent-dir";
}

interface OpenClawConfigAgent {
  id: string;
  name?: string;
  workspace?: string;
  model?: {
    primary?: string;
  };
  ui?: {
    emoji?: string;
    color?: string;
  };
}

interface OpenClawConfig {
  agents?: {
    list?: OpenClawConfigAgent[];
    defaults?: {
      model?: {
        primary?: string;
      };
    };
  };
}

export function readOpenClawConfig(): OpenClawConfig | null {
  if (!existsSync(OPENCLAW_CONFIG)) return null;

  try {
    return JSON.parse(readFileSync(OPENCLAW_CONFIG, "utf-8")) as OpenClawConfig;
  } catch {
    return null;
  }
}

function resolveWorkspace(agentId: string, configuredWorkspace?: string): string {
  if (configuredWorkspace) return configuredWorkspace;
  if (agentId === "main") return OPENCLAW_WORKSPACE;

  const candidate = join(OPENCLAW_DIR, `workspace-${agentId}`);
  return existsSync(candidate) ? candidate : OPENCLAW_WORKSPACE;
}

export function discoverAgents(): DiscoveredAgent[] {
  const config = readOpenClawConfig();
  const configuredAgents = config?.agents?.list ?? [];
  const defaultModel = config?.agents?.defaults?.model?.primary || "unknown";

  if (configuredAgents.length > 0) {
    return configuredAgents.map((agent) => {
      const workspace = resolveWorkspace(agent.id, agent.workspace);
      const identity = readWorkspaceIdentity(workspace);

      return {
        id: agent.id,
        name: identity.name || agent.name || agent.id,
        emoji: identity.emoji || agent.ui?.emoji || "🤖",
        color: agent.ui?.color || "#666666",
        workspace,
        model: agent.model?.primary || defaultModel,
        source: "config",
      };
    });
  }

  const agentsDir = join(OPENCLAW_DIR, "agents");
  if (!existsSync(agentsDir)) {
    const identity = readWorkspaceIdentity(OPENCLAW_WORKSPACE);
    return [
      {
        id: "main",
        name: identity.name || "main",
        emoji: identity.emoji || "🤖",
        color: "#ff6b35",
        workspace: OPENCLAW_WORKSPACE,
        model: defaultModel,
        source: "agent-dir",
      },
    ];
  }

  const agentIds = readdirSync(agentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => (a === "main" ? -1 : b === "main" ? 1 : a.localeCompare(b)));

  if (agentIds.length === 0) {
    const identity = readWorkspaceIdentity(OPENCLAW_WORKSPACE);
    return [
      {
        id: "main",
        name: identity.name || "main",
        emoji: identity.emoji || "🤖",
        color: "#ff6b35",
        workspace: OPENCLAW_WORKSPACE,
        model: defaultModel,
        source: "agent-dir",
      },
    ];
  }

  return agentIds.map((id) => {
    const workspace = resolveWorkspace(id);
    const identity = readWorkspaceIdentity(workspace);

    return {
      id,
      name: identity.name || id,
      emoji: identity.emoji || "🤖",
      color: id === "main" ? "#ff6b35" : "#666666",
      workspace,
      model: defaultModel,
      source: "agent-dir",
    };
  });
}

export function readAgentSessionSummary(agentId: string): {
  updatedAt?: string;
  activeSessions: number;
} {
  const sessionsPath = join(OPENCLAW_DIR, "agents", agentId, "sessions", "sessions.json");
  if (!existsSync(sessionsPath)) {
    return { activeSessions: 0 };
  }

  try {
    const parsed = JSON.parse(readFileSync(sessionsPath, "utf-8")) as Record<string, { updatedAt?: number }>;
    const sessions = Object.values(parsed);
    const latest = sessions
      .map((session) => session.updatedAt || 0)
      .sort((a, b) => b - a)[0];

    return {
      updatedAt: latest ? new Date(latest).toISOString() : undefined,
      activeSessions: sessions.length,
    };
  } catch {
    return { activeSessions: 0 };
  }
}
