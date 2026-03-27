import { execSync } from "child_process";
import { NextRequest, NextResponse } from "next/server";
import { isLocalCronJobId } from "@/lib/cron-jobs";
import { listCronRuns, type CronRunEntry } from "@/lib/cron-run-history";

interface RawRun {
  id?: string;
  startedAt?: string;
  createdAt?: string;
  completedAt?: string;
  finishedAt?: string;
  status?: string;
  durationMs?: number;
  error?: string;
}

function normalizeGatewayRuns(jobId: string, rawRuns: RawRun[]): CronRunEntry[] {
  return rawRuns.map((run) => ({
    id: run.id || `${jobId}-${run.startedAt || run.createdAt || Date.now()}`,
    jobId,
    startedAt: run.startedAt || run.createdAt || null,
    completedAt: run.completedAt || run.finishedAt || null,
    status: run.status || "unknown",
    durationMs:
      run.durationMs ||
      (run.startedAt && run.completedAt
        ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
        : null),
    error: run.error || null,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status") || "all";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const limit = Number(searchParams.get("limit") || "10");

    if (!id) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    if (isLocalCronJobId(id)) {
      const runs = listCronRuns({ jobId: id, status, from, to, limit });
      return NextResponse.json({ runs, total: runs.length });
    }

    let runs: CronRunEntry[] = [];

    try {
      const output = execSync(`openclaw cron runs ${id} --json 2>/dev/null`, {
        timeout: 10000,
        encoding: "utf-8",
      });

      const data = JSON.parse(output);
      const rawRuns: RawRun[] = Array.isArray(data?.runs) ? data.runs : Array.isArray(data) ? data : [];

      runs = normalizeGatewayRuns(id, rawRuns)
        .filter((run) => (status !== "all" ? run.status === status : true))
        .filter((run) => {
          const ts = run.startedAt ? new Date(run.startedAt).getTime() : null;
          if (ts === null) return true;
          if (from && ts < new Date(from).getTime()) return false;
          if (to && ts > new Date(to).getTime()) return false;
          return true;
        })
        .slice(0, limit);
    } catch {
      runs = [];
    }

    return NextResponse.json({ runs, total: runs.length });
  } catch (error) {
    console.error("Error fetching run history:", error);
    return NextResponse.json({ error: "Failed to fetch run history" }, { status: 500 });
  }
}
