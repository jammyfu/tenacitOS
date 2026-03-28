/**
 * useDockerInstances — fetches openclaw Docker instances
 *
 * Polls /api/mii/docker-instances every 5s.
 * On mount, also attempts a direct WebSocket connection to
 * ws://127.0.0.1:18789 to receive real-time status updates.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DockerInstance } from "@/lib/mii-types";

interface LiveAgentStatus {
  id: string;
  status?: string;
}

interface AgentStatusMessage {
  type?: string;
  agents?: LiveAgentStatus[];
}

export function useDockerInstances(pollIntervalMs = 5_000) {
  const [instances, setInstances] = useState<DockerInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch("/api/mii/docker-instances");
      const data = await res.json();
      if (mountedRef.current) {
        setInstances(data.instances ?? []);
        setLoading(false);
      }
    } catch {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // ── REST polling ──────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    const initialTimer = setTimeout(() => {
      void fetchInstances();
    }, 0);
    const interval = setInterval(fetchInstances, pollIntervalMs);
    return () => {
      mountedRef.current = false;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [fetchInstances, pollIntervalMs]);

  // ── WebSocket (openclaw-control-plane) ────────────────────────────────────
  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket("ws://127.0.0.1:18789");
      wsRef.current = ws;

      ws.addEventListener("message", (evt) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(evt.data as string) as AgentStatusMessage;
          // Handle status update messages from openclaw
          if (msg?.type === "agent_status" && msg?.agents) {
            setInstances((prev) =>
              prev.map((inst) => {
                const live = msg.agents?.find((agent) => agent.id === inst.id);
                if (!live) return inst;
                return {
                  ...inst,
                  status:
                    live.status === "running"
                      ? "running"
                      : live.status === "stopped"
                      ? "stopped"
                      : live.status === "error"
                      ? "error"
                      : "unknown",
                };
              })
            );
          }
        } catch {
          // Non-JSON message — ignore
        }
      });

      ws.addEventListener("error", () => {
        // Control plane not running — that's fine, REST polling covers this
      });
    } catch {
      // WebSocket not available in this environment
    }

    return () => {
      ws?.close();
    };
  }, []);

  return { instances, loading, refetch: fetchInstances };
}
