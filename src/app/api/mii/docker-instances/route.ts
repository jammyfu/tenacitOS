/**
 * /api/mii/docker-instances
 *
 * Fetches the list of openclaw agent instances from the local config file
 * (same source as /api/agents) and returns them in the DockerInstance shape
 * expected by the Mii character system.
 *
 * Also attempts a WebSocket handshake to ws://127.0.0.1:18789 to verify
 * liveness, but falls back gracefully if the service is not running.
 */

import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import type { DockerInstance } from "@/lib/mii-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const instances: DockerInstance[] = [];

  // ── Read from openclaw.json (same as /api/agents) ─────────────────────────
  try {
    const configPath =
      (process.env.OPENCLAW_DIR || "/root/.openclaw") + "/openclaw.json";
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      for (const agent of config?.agents?.list ?? []) {
        const agentId: string = agent.id;
        instances.push({
          id: agentId,
          name: agent.name || agentId,
          status: "unknown",
          workspace: agent.workspace,
          model: agent.model?.primary || config?.agents?.defaults?.model?.primary,
          emoji: agent?.ui?.emoji || "🤖",
          color: agent?.ui?.color || "#666666",
        });
      }
    }
  } catch {
    // openclaw not configured — return empty list
  }

  // ── Attempt live status check via HTTP (ws fallback) ──────────────────────
  // openclaw-control-plane exposes a REST endpoint alongside its WebSocket.
  // Try /api/status — if unavailable, leave status as "unknown".
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch("http://127.0.0.1:18789/api/status", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      // Merge live status into our instances list
      for (const inst of instances) {
        const live = data?.agents?.find((a: any) => a.id === inst.id);
        if (live) {
          inst.status = live.status === "running" ? "running" : "stopped";
        }
      }
    }
  } catch {
    // control plane not reachable — that's fine
  }

  return NextResponse.json({ instances });
}
