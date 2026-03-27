/**
 * Mii Character System — Server-Side Storage
 *
 * Persists characters as a JSON file at data/mii-characters.json.
 * Falls back gracefully if the file doesn't exist yet.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { MiiCharacter } from "./mii-types";

const DATA_PATH = join(process.cwd(), "data", "mii-characters.json");

export function readCharacters(): MiiCharacter[] {
  try {
    if (!existsSync(DATA_PATH)) return [];
    const raw = readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw) as MiiCharacter[];
  } catch {
    return [];
  }
}

export function writeCharacters(characters: MiiCharacter[]): void {
  writeFileSync(DATA_PATH, JSON.stringify(characters, null, 2), "utf-8");
}

export function findCharacter(id: string): MiiCharacter | undefined {
  return readCharacters().find((c) => c.id === id);
}

export function upsertCharacter(character: MiiCharacter): MiiCharacter {
  const all = readCharacters();
  const idx = all.findIndex((c) => c.id === character.id);
  if (idx >= 0) {
    all[idx] = character;
  } else {
    all.push(character);
  }
  writeCharacters(all);
  return character;
}

export function deleteCharacter(id: string): boolean {
  const all = readCharacters();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  writeCharacters(next);
  return true;
}
