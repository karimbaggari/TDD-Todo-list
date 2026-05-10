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
  const resolved = path.resolve(DATA_DIR, `${id}.json`);
  if (!resolved.startsWith(path.resolve(DATA_DIR) + path.sep)) {
    throw new Error("Path traversal detected");
  }
  return resolved;
}

export async function readAll<T>(): Promise<T[]> {
  await ensureDataDir();
  const files = await fs.readdir(DATA_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  return Promise.all(
    jsonFiles.map(async (file) => {
      const content = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
      return JSON.parse(content) as T;
    })
  );
}

export async function readOne<T>(id: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath(id), "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeOne<T>(id: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath(id), JSON.stringify(data, null, 2));
}

export async function deleteOne(id: string): Promise<boolean> {
  try {
    await fs.unlink(filePath(id));
    return true;
  } catch {
    return false;
  }
}
