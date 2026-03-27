import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const DATA_PATH = join(process.cwd(), "data", "cron-runs.json");

export interface CronRunEntry {
  id: string;
  jobId: string;
  startedAt: string | null;
  completedAt: string | null;
  status: string;
  durationMs: number | null;
  error: string | null;
}

interface RunFilters {
  jobId: string;
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
}

function readRuns(): CronRunEntry[] {
  if (!existsSync(DATA_PATH)) return [];

  try {
    const raw = readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRuns(runs: CronRunEntry[]): void {
  writeFileSync(DATA_PATH, JSON.stringify(runs, null, 2), "utf-8");
}

export function listCronRuns(filters: RunFilters): CronRunEntry[] {
  const fromTs = filters.from ? new Date(filters.from).getTime() : null;
  const toTs = filters.to ? new Date(filters.to).getTime() : null;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;

  return readRuns()
    .filter((run) => run.jobId === filters.jobId)
    .filter((run) => (filters.status && filters.status !== "all" ? run.status === filters.status : true))
    .filter((run) => {
      const ts = run.startedAt ? new Date(run.startedAt).getTime() : null;
      if (ts === null) return true;
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    })
    .sort((a, b) => {
      const aTs = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const bTs = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return bTs - aTs;
    })
    .slice(0, limit);
}

export function recordCronRun(
  jobId: string,
  run: Partial<CronRunEntry> & Pick<CronRunEntry, "status">
): CronRunEntry {
  const runs = readRuns();
  const now = new Date().toISOString();
  const startedAt = run.startedAt || now;
  const completedAt = run.completedAt || now;

  const entry: CronRunEntry = {
    id: run.id || `local-run-${randomUUID()}`,
    jobId,
    startedAt,
    completedAt,
    status: run.status,
    durationMs: run.durationMs ?? Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime()),
    error: run.error || null,
  };

  runs.push(entry);
  writeRuns(runs);
  return entry;
}
