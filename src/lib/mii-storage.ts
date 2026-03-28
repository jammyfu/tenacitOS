/**
 * Mii Character System — Server-Side Storage
 *
 * Persists characters as a JSON file at data/mii-characters.json.
 * Falls back gracefully if the file doesn't exist yet.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import type { MiiCharacter } from "./mii-types";
import { normalizeCharacter } from "./mii-utils";

const DATA_PATH = join(process.cwd(), "data", "mii-characters.json");

export function readCharacters(): MiiCharacter[] {
  try {
    if (!existsSync(DATA_PATH)) return [];
    const raw = readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((character) => normalizeCharacter(character))
      : [];
  } catch {
    return [];
  }
}

export function writeCharacters(characters: MiiCharacter[]): void {
  const dir = dirname(DATA_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(characters, null, 2), "utf-8");
}

export function findCharacter(id: string): MiiCharacter | undefined {
  return readCharacters().find((c) => c.id === id);
}

export function upsertCharacter(character: MiiCharacter): MiiCharacter {
  const all = readCharacters();
  const normalized = normalizeCharacter(character);
  const idx = all.findIndex((c) => c.id === normalized.id);
  if (idx >= 0) {
    all[idx] = normalized;
  } else {
    all.push(normalized);
  }
  writeCharacters(all);
  return normalized;
}

export function deleteCharacter(id: string): boolean {
  const all = readCharacters();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  writeCharacters(next);
  return true;
}
