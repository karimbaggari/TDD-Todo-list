import fs from "fs/promises";
import path from "path";

let DATA_DIR = path.join(process.cwd(), "data");

export function setDataDir(dir: string) {
  DATA_DIR = dir;
}

export async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export function filePath(id: string) {
  return path.join(DATA_DIR, `${id}.json`);
}

export async function readAll<T>(): Promise<T[]> {
  return [];
}

export async function readOne<T>(id: string): Promise<T | null> {
  return null;
}

export async function writeOne<T>(id: string, data: T): Promise<void> {
}

export async function deleteOne(id: string): Promise<boolean> {
  return false;
}
