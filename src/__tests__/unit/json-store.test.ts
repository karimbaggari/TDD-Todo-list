import fs from "fs/promises";
import path from "path";
import { setDataDir, readAll, readOne, writeOne, deleteOne } from "@/helpers/json-store";

const TEST_DIR = path.join(process.cwd(), "data-json-store-test");

beforeAll(() => {
  setDataDir(TEST_DIR);
});

beforeEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
  await fs.mkdir(TEST_DIR, { recursive: true });
});

afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

const sampleData = { id: "abc-123", name: "Test item" };

// ─── writing records ────────────────────────────────────────

describe("writing records", () => {
  it("persists data as a JSON file", async () => {
    await writeOne("abc-123", sampleData);

    const content = await fs.readFile(path.join(TEST_DIR, "abc-123.json"), "utf-8");
    expect(JSON.parse(content)).toEqual(sampleData);
  });

  it("overwrites existing data for the same id", async () => {
    await writeOne("abc-123", sampleData);
    const updated = { ...sampleData, name: "Updated" };
    await writeOne("abc-123", updated);

    const content = await fs.readFile(path.join(TEST_DIR, "abc-123.json"), "utf-8");
    expect(JSON.parse(content)).toEqual(updated);
  });
});

// ─── reading records ────────────────────────────────────────

describe("reading records", () => {
  it("retrieves a record by id", async () => {
    await writeOne("abc-123", sampleData);

    const result = await readOne("abc-123");

    expect(result).toEqual(sampleData);
  });

  it("returns null for a non-existent id", async () => {
    const result = await readOne("non-existent");

    expect(result).toBeNull();
  });

  it("retrieves all records", async () => {
    const item1 = { id: "1", name: "First" };
    const item2 = { id: "2", name: "Second" };
    await writeOne("1", item1);
    await writeOne("2", item2);

    const result = await readAll();

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([item1, item2]));
  });

  it("returns an empty list when no records exist", async () => {
    const result = await readAll();

    expect(result).toEqual([]);
  });

  it("ignores non-JSON files", async () => {
    await writeOne("1", sampleData);
    await fs.writeFile(path.join(TEST_DIR, "notes.txt"), "not json");

    const result = await readAll();

    expect(result).toHaveLength(1);
  });
});

// ─── deleting records ───────────────────────────────────────

describe("deleting records", () => {
  it("removes the file and returns true", async () => {
    await writeOne("abc-123", sampleData);

    const result = await deleteOne("abc-123");

    expect(result).toBe(true);
    const exists = await fs
      .access(path.join(TEST_DIR, "abc-123.json"))
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });

  it("returns false for a non-existent id", async () => {
    const result = await deleteOne("non-existent");

    expect(result).toBe(false);
  });
});
