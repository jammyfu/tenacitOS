/**
 * /api/mii — CRUD for Mii characters
 *
 * GET    → list all characters
 * POST   → create a new character
 * PUT    → update an existing character
 * DELETE → delete a character (?id=xxx)
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  readCharacters,
  upsertCharacter,
  deleteCharacter,
} from "@/lib/mii-storage";
import type { MiiCharacter } from "@/lib/mii-types";
import { normalizeCharacter } from "@/lib/mii-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const characters = readCharacters();
  return NextResponse.json({ characters });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();
    const character: MiiCharacter = normalizeCharacter({
      ...body,
      id: body.id || randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
    upsertCharacter(character);
    return NextResponse.json({ character });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const existing = readCharacters().find((character) => character.id === body.id);
    const character: MiiCharacter = normalizeCharacter({
      ...existing,
      ...body,
      createdAt: body.createdAt || existing?.createdAt,
      updatedAt: new Date().toISOString(),
    });
    upsertCharacter(character);
    return NextResponse.json({ character });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const deleted = deleteCharacter(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
