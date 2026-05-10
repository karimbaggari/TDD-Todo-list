/**
 * SYSTEM TESTS — "Does the full system work including its infrastructure?"
 *
 * When system tests earn their place:
 * - When you need to verify the STORAGE CONTRACT (data format, schema,
 *   file layout) — not just that "data round-trips," but HOW it's stored.
 * - When migrating infrastructure (files → database, REST → gRPC) and you
 *   need to prove the new system satisfies the old contract.
 * - When testing infrastructure concerns: "Does the data directory get
 *   created automatically?" "Is the JSON format machine-readable by other tools?"
 *
 * In THIS project: These tests ask a question the other layers mostly don't:
 * "What does the data look like ON DISK?" Look at the test "adding a todo
 * creates a JSON file on disk" — it reads the actual file and checks the
 * JSON structure. Integration tests verify behavior; system tests verify
 * the storage contract. That said, the persistence/reload tests overlap
 * heavily with both integration and E2E tests.
 *
 * Student exercise: If you changed the storage from JSON files to SQLite,
 * which tests would break? Unit and E2E tests shouldn't. System tests SHOULD.
 * That's their unique value — they test the infrastructure contract.
 */
import { test, expect } from "@playwright/test";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function clearData() {
  await fs.rm(DATA_DIR, { recursive: true, force: true });
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function listJsonFiles(): Promise<string[]> {
  const files = await fs.readdir(DATA_DIR);
  return files.filter((f) => f.endsWith(".json"));
}

async function readJsonFile(filename: string) {
  const content = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
  return JSON.parse(content);
}

test.beforeEach(async () => {
  await clearData();
});

test.afterAll(async () => {
  await clearData();
});

// ─── HTTP response ───────────────────────────────────────────

test("GET / returns 200 with HTML containing the todo form", async ({ request }) => {
  const response = await request.get("/");

  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("Add a new todo");
});

// ─── Data persistence on disk ────────────────────────────────

test("adding a todo creates a JSON file on disk", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Add a new todo").fill("Persisted todo");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Persisted todo")).toBeVisible();

  const files = await listJsonFiles();
  expect(files).toHaveLength(1);

  const data = await readJsonFile(files[0]);
  expect(data.title).toBe("Persisted todo");
  expect(data.completed).toBe(false);
  expect(data.id).toBeDefined();
  expect(data.createdAt).toBeDefined();
});

test("adding a todo with empty title creates no file", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add" }).click();

  const files = await listJsonFiles();
  expect(files).toHaveLength(0);
});

// ─── Data survives reload ────────────────────────────────────

test("todo persists after page reload", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Add a new todo").fill("Survive reload");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Survive reload")).toBeVisible();

  await page.reload();

  await expect(page.getByText("Survive reload")).toBeVisible();
});

// ─── Toggle persists on disk ─────────────────────────────────

test("toggling a todo updates the JSON file on disk", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Add a new todo").fill("Toggle me");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Toggle me")).toBeVisible();

  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();

  const files = await listJsonFiles();
  const data = await readJsonFile(files[0]);
  expect(data.completed).toBe(true);
});

test("toggled state persists after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Add a new todo").fill("Toggle persist");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();

  await page.reload();

  await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();
});

// ─── Delete removes file from disk ──────────────────────────

test("deleting a todo removes the JSON file from disk", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Add a new todo").fill("Delete me");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Delete me")).toBeVisible();

  const filesBefore = await listJsonFiles();
  expect(filesBefore).toHaveLength(1);

  await page.getByRole("button", { name: "Delete todo" }).click();
  await expect(page.getByText("Delete me")).not.toBeVisible();

  const filesAfter = await listJsonFiles();
  expect(filesAfter).toHaveLength(0);
});
