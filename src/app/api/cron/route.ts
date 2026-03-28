import { execSync } from "child_process";
import { NextRequest, NextResponse } from "next/server";
import {
  createCronJob,
  isLocalCronJobId,
  listCronJobs,
  normalizeGatewayCronJob,
  removeCronJob,
  setCronJobEnabled,
  updateCronJob,
} from "@/lib/cron-jobs";
import { isValidCron } from "@/lib/cron-parser";

function readGatewayCronJobs() {
  try {
    const output = execSync("openclaw cron list --json --all 2>/dev/null", {
      timeout: 10000,
      encoding: "utf-8",
    });

    const data = JSON.parse(output);
    return Array.isArray(data.jobs)
      ? data.jobs.map((job: Record<string, unknown>) => normalizeGatewayCronJob(job))
      : [];
  } catch {
    return null;
  }
}

function validateCronPayload(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const schedule = typeof body.schedule === "string" ? body.schedule.trim() : "";
  const timezone = typeof body.timezone === "string" && body.timezone.trim()
    ? body.timezone.trim()
    : "UTC";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const agentId = typeof body.agentId === "string" && body.agentId.trim()
    ? body.agentId.trim()
    : "main";

  if (!name) {
    return { error: "Job name is required" };
  }

  if (!schedule) {
    return { error: "Schedule is required" };
  }

  if (!isValidCron(schedule)) {
    return { error: "Invalid cron expression" };
  }

  return {
    data: {
      name,
      schedule,
      timezone,
      description,
      agentId,
      sessionTarget: agentId,
      enabled: body.enabled === false ? false : true,
      payload: {
        kind: "agentTurn",
        message: description || name,
      },
    },
  };
}

export async function GET() {
  try {
    const localJobs = listCronJobs();
    const gatewayJobs = readGatewayCronJobs();

    if (!gatewayJobs) {
      return NextResponse.json(localJobs);
    }

    return NextResponse.json([...gatewayJobs, ...localJobs]);
  } catch (error) {
    console.error("Error fetching cron jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch cron jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateCronPayload(body);

    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const job = createCronJob(validation.data);
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error creating cron job:", error);
    return NextResponse.json(
      { error: "Failed to create cron job" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";

    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    if (!isLocalCronJobId(id)) {
      return NextResponse.json(
        { error: "Editing gateway-managed cron jobs is not supported from the dashboard yet" },
        { status: 400 }
      );
    }

    const validation = validateCronPayload(body);
    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const updated = updateCronJob(id, validation.data);
    if (!updated) {
      return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating cron job:", error);
    return NextResponse.json(
      { error: "Failed to update cron job" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const enabled = Boolean(body.enabled);

    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    if (isLocalCronJobId(id)) {
      const updated = setCronJobEnabled(id, enabled);
      if (!updated) {
        return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
      }
      return NextResponse.json(updated);
    }

    const action = enabled ? "enable" : "disable";
    execSync(
      `openclaw cron ${action} ${id} --json 2>/dev/null || openclaw cron update ${id} --enabled=${enabled} --json 2>/dev/null`,
      { timeout: 10000, encoding: "utf-8" }
    );

    return NextResponse.json({ success: true, id, enabled });
  } catch (error) {
    console.error("Error toggling cron job:", error);
    return NextResponse.json(
      { error: "Failed to update cron job" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    if (isLocalCronJobId(id)) {
      const removed = removeCronJob(id);
      if (!removed) {
        return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, deleted: id });
    }

    execSync(`openclaw cron remove ${id} 2>/dev/null`, {
      timeout: 10000,
      encoding: "utf-8",
    });

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error("Error deleting cron job:", error);
    return NextResponse.json(
      { error: "Failed to delete cron job" },
      { status: 500 }
    );
  }
}
