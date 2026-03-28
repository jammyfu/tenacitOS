/**
 * POST /api/mii/export
 *
 * Exports all Mii characters to ~/.openclaw/mii-characters.json
 * Creates ~/.openclaw/ directory if it doesn't exist.
 *
 * Returns { success, path, count }
 */

import { NextResponse } from "next/server";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { readCharacters } from "@/lib/mii-storage";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const characters = readCharacters();

    const openclawDir = join(homedir(), ".openclaw");
    if (!existsSync(openclawDir)) {
      mkdirSync(openclawDir, { recursive: true });
    }

    const exportPath = join(openclawDir, "mii-characters.json");
    const payload = {
      exportedAt: new Date().toISOString(),
      source: "tenacitOS",
      count: characters.length,
      characters,
    };

    writeFileSync(exportPath, JSON.stringify(payload, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      path: exportPath,
      count: characters.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
