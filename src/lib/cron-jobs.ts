import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { cronToHuman, getNextRuns, isValidCron } from "./cron-parser";

const DATA_PATH = join(process.cwd(), "data", "cron-jobs.json");
const EXAMPLE_DATA_PATH = join(process.cwd(), "data", "cron-jobs.example.json");

export interface StoredCronJob {
  id: string;
  agentId: string;
  name: string;
  description: string;
  schedule: string;
  timezone: string;
  enabled: boolean;
  sessionTarget: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastRun: string | null;
  nextRun: string | null;
}

export interface CronJobInput {
  id?: string;
  agentId?: string;
  name: string;
  description?: string;
  schedule: string;
  timezone?: string;
  enabled?: boolean;
  sessionTarget?: string;
  payload?: Record<string, unknown>;
}

export interface CronJobResponse extends StoredCronJob {
  scheduleDisplay: string;
}

function readJsonArray(filePath: string): unknown[] {
  if (!existsSync(filePath)) return [];

  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getNextRun(schedule: string, timezone: string, enabled: boolean): string | null {
  if (!enabled || !isValidCron(schedule)) return null;
  return getNextRuns(schedule, 1, new Date(), timezone)[0]?.toISOString() ?? null;
}

function normalizeCronJob(job: Partial<StoredCronJob> & Pick<CronJobInput, "name" | "schedule">): StoredCronJob {
  const now = new Date().toISOString();
  const schedule = String(job.schedule || "").trim();
  const enabled = job.enabled ?? true;
  const timezone = job.timezone || "UTC";
  const agentId = job.agentId || "main";
  const description = job.description?.trim() || "";

  return {
    id: job.id || `local-${randomUUID()}`,
    agentId,
    name: job.name.trim(),
    description,
    schedule,
    timezone,
    enabled,
    sessionTarget: job.sessionTarget || agentId,
    payload: job.payload || {
      kind: "agentTurn",
      message: description || job.name.trim(),
    },
    createdAt: job.createdAt || now,
    updatedAt: now,
    lastRun: job.lastRun || null,
    nextRun: job.nextRun ?? getNextRun(schedule, timezone, enabled),
  };
}

export function readCronJobs(): StoredCronJob[] {
  const source = existsSync(DATA_PATH) ? DATA_PATH : EXAMPLE_DATA_PATH;
  return readJsonArray(source)
    .map((entry) => {
      const job = entry as Partial<StoredCronJob>;

      if (!job?.name || !job?.schedule) {
        return null;
      }

      return normalizeCronJob({
        ...job,
        name: job.name,
        schedule: job.schedule,
        id: typeof job.id === "string" && job.id.startsWith("local-")
          ? job.id
          : `local-${job.id || randomUUID()}`,
      });
    })
    .filter((job): job is StoredCronJob => job !== null);
}

export function writeCronJobs(jobs: StoredCronJob[]): void {
  writeFileSync(DATA_PATH, JSON.stringify(jobs, null, 2), "utf-8");
}

export function listCronJobs(): CronJobResponse[] {
  return readCronJobs()
    .map(toCronJobResponse)
    .sort((a, b) => {
      if (a.enabled !== b.enabled) {
        return a.enabled ? -1 : 1;
      }

      const aNext = a.nextRun ? new Date(a.nextRun).getTime() : Number.MAX_SAFE_INTEGER;
      const bNext = b.nextRun ? new Date(b.nextRun).getTime() : Number.MAX_SAFE_INTEGER;
      return aNext - bNext;
    });
}

export function createCronJob(input: CronJobInput): CronJobResponse {
  const jobs = readCronJobs();
  const job = normalizeCronJob(input);
  jobs.push(job);
  writeCronJobs(jobs);
  return toCronJobResponse(job);
}

export function updateCronJob(id: string, updates: Partial<CronJobInput>): CronJobResponse | null {
  const jobs = readCronJobs();
  const index = jobs.findIndex((job) => job.id === id);
  if (index < 0) return null;

  const current = jobs[index];
  const updated = normalizeCronJob({
    ...current,
    ...updates,
    id: current.id,
    name: updates.name ?? current.name,
    schedule: updates.schedule ?? current.schedule,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
    lastRun: current.lastRun,
    nextRun: getNextRun(
      updates.schedule ?? current.schedule,
      updates.timezone ?? current.timezone,
      updates.enabled ?? current.enabled
    ),
  });

  jobs[index] = updated;
  writeCronJobs(jobs);
  return toCronJobResponse(updated);
}

export function setCronJobEnabled(id: string, enabled: boolean): CronJobResponse | null {
  return updateCronJob(id, { enabled });
}

export function recordCronJobRun(id: string, completedAt: string = new Date().toISOString()): CronJobResponse | null {
  const jobs = readCronJobs();
  const index = jobs.findIndex((job) => job.id === id);
  if (index < 0) return null;

  const current = jobs[index];
  const updated = normalizeCronJob({
    ...current,
    id: current.id,
    name: current.name,
    schedule: current.schedule,
    createdAt: current.createdAt,
    lastRun: completedAt,
  });

  jobs[index] = updated;
  writeCronJobs(jobs);
  return toCronJobResponse(updated);
}

export function removeCronJob(id: string): boolean {
  const jobs = readCronJobs();
  const nextJobs = jobs.filter((job) => job.id !== id);
  if (nextJobs.length === jobs.length) return false;
  writeCronJobs(nextJobs);
  return true;
}

export function isLocalCronJobId(id: string): boolean {
  return id.startsWith("local-");
}

export function toCronJobResponse(job: StoredCronJob): CronJobResponse {
  return {
    ...job,
    nextRun: getNextRun(job.schedule, job.timezone, job.enabled),
    scheduleDisplay: `${job.schedule} (${job.timezone})`,
  };
}

export function normalizeGatewayCronJob(job: Record<string, unknown>): CronJobResponse {
  const schedule = formatGatewaySchedule(job.schedule as Record<string, unknown>);
  const timezone = (job.schedule as Record<string, string> | undefined)?.tz || "UTC";
  const description = formatGatewayDescription(job);
  const cronExpr = typeof (job.schedule as Record<string, unknown> | undefined)?.expr === "string"
    ? String((job.schedule as Record<string, unknown>).expr)
    : "";

  return {
    id: String(job.id || `gateway-${randomUUID()}`),
    agentId: String(job.agentId || "main"),
    name: String(job.name || "Unnamed"),
    description,
    schedule: cronExpr || schedule,
    scheduleDisplay: schedule,
    timezone,
    enabled: Boolean(job.enabled ?? true),
    nextRun: (job.state as Record<string, number> | undefined)?.nextRunAtMs
      ? new Date((job.state as Record<string, number>).nextRunAtMs).toISOString()
      : null,
    lastRun: (job.state as Record<string, number> | undefined)?.lastRunAtMs
      ? new Date((job.state as Record<string, number>).lastRunAtMs).toISOString()
      : null,
    sessionTarget: String(job.sessionTarget || job.agentId || "main"),
    payload: (job.payload as Record<string, unknown>) || {},
    createdAt: job.createdAtMs ? new Date(Number(job.createdAtMs)).toISOString() : new Date().toISOString(),
    updatedAt: job.updatedAtMs ? new Date(Number(job.updatedAtMs)).toISOString() : new Date().toISOString(),
  };
}

function formatGatewayDescription(job: Record<string, unknown>): string {
  const payload = job.payload as Record<string, unknown> | undefined;
  if (!payload) return "";

  if (payload.kind === "agentTurn") {
    const msg = String(payload.message || "");
    return msg.length > 120 ? `${msg.slice(0, 120)}...` : msg;
  }

  if (payload.kind === "systemEvent") {
    const text = String(payload.text || "");
    return text.length > 120 ? `${text.slice(0, 120)}...` : text;
  }

  return "";
}

function formatGatewaySchedule(schedule: Record<string, unknown> | undefined): string {
  if (!schedule) return "Unknown";

  switch (schedule.kind) {
    case "cron": {
      const expr = String(schedule.expr || "");
      const tz = schedule.tz ? ` (${schedule.tz})` : "";
      return expr ? `${expr}${tz}` : cronToHuman(expr);
    }
    case "every": {
      const ms = Number(schedule.everyMs || 0);
      if (ms >= 3600000) return `Every ${ms / 3600000}h`;
      if (ms >= 60000) return `Every ${ms / 60000}m`;
      return `Every ${ms / 1000}s`;
    }
    case "at":
      return `Once at ${String(schedule.at || "")}`;
    default:
      return JSON.stringify(schedule);
  }
}
