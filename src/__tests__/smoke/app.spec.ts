/**
 * SMOKE TESTS — "Is the application alive?"
 *
 * When smoke tests earn their place:
 * - Large systems with 500+ E2E tests that take 30 minutes to run.
 *   Smoke tests give a 30-second "anything obviously broken?" fast-fail.
 * - After deploying to staging/production — hit 3-4 critical paths to
 *   verify the deployment didn't break the basics.
 * - When E2E infrastructure is expensive (Selenium grids, cloud browsers).
 *
 * In THIS project: Compare every test below with e2e/todo.spec.ts.
 * You'll find each smoke test is an identical copy of an E2E test.
 * When your entire E2E suite runs in seconds, the E2E suite IS the smoke test.
 *
 * Student exercise: Try removing this file and running the E2E suite.
 * Does your confidence level change? If not, the smoke tests add no signal.
 */
import { test, expect } from "@playwright/test";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function clearTodos() {
  await fs.rm(DATA_DIR, { recursive: true, force: true });
  await fs.mkdir(DATA_DIR, { recursive: true });
}

test.beforeEach(async () => {
  await clearTodos();
});

test.afterAll(async () => {
  await clearTodos();
});

test("app returns 200", async ({ request }) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
});

test("page renders heading and form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Todo List" })).toBeVisible();
  await expect(page.getByPlaceholder("Add a new todo")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add" })).toBeVisible();
});

test("can add a todo", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Add a new todo").fill("Smoke test todo");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Smoke test todo")).toBeVisible();
});

test("can delete a todo", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Add a new todo").fill("Delete me");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Delete me")).toBeVisible();

  await page.getByRole("button", { name: "Delete todo" }).click();
  await expect(page.getByText("Delete me")).not.toBeVisible();
});
