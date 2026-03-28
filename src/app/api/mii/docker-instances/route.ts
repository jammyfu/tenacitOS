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
import type { DockerInstance } from "@/lib/mii-types";
import { readCharacters } from "@/lib/mii-storage";
import { getPrimaryBinding, getCharacterBindings } from "@/lib/mii-utils";
import { discoverAgents } from "@/lib/openclaw-discovery";

export const dynamic = "force-dynamic";

interface LiveStatusPayload {
  agents?: Array<{
    id: string;
    status?: string;
  }>;
}

export async function GET() {
  const characters = readCharacters();
  const instances: DockerInstance[] = discoverAgents().map((agent) => {
    const assignedCharacter = characters.find(
      (character) => getPrimaryBinding(character)?.instanceId === agent.id
    );
    const assignedDuty =
      assignedCharacter &&
      getCharacterBindings(assignedCharacter).find(
        (binding) => binding.instanceId === agent.id
      )?.duty;

    return {
      id: agent.id,
      name: agent.name,
      status: "unknown",
      workspace: agent.workspace,
      model: agent.model,
      emoji: agent.emoji,
      color: agent.color,
      runtime: "docker",
      containerName: `openclaw-${agent.id === "main" ? "claw01" : agent.id}`,
      assignedCharacterId: assignedCharacter?.id,
      assignedCharacterName: assignedCharacter?.name,
      assignedDuty,
    };
  });

  // Discovery is already resilient; keep runtime status enrichment below.

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
      const data = (await res.json()) as LiveStatusPayload;
      // Merge live status into our instances list
      for (const inst of instances) {
        const live = data?.agents?.find((agent) => agent.id === inst.id);
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
