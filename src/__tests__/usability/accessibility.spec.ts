import { test, expect } from "@playwright/test";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function clearData() {
  await fs.rm(DATA_DIR, { recursive: true, force: true });
  await fs.mkdir(DATA_DIR, { recursive: true });
}

test.beforeEach(async () => {
  await clearData();
});

test.afterAll(async () => {
  await clearData();
});

// ─── Aria labels ─────────────────────────────────────────────

test.describe("aria labels", () => {
  test("add button is labeled", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Add" })).toBeVisible();
  });

  test("toggle button has correct aria-label when incomplete", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Test todo");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByRole("button", { name: "Mark complete" })).toBeVisible();
  });

  test("toggle button has correct aria-label when complete", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Test todo");
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByRole("button", { name: "Mark complete" }).click();

    await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();
  });

  test("delete button has aria-label", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Test todo");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByRole("button", { name: "Delete todo" })).toBeVisible();
  });

  test("input has placeholder text as accessible name", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Add a new todo")).toBeVisible();
  });
});

// ─── Keyboard navigation ────────────────────────────────────

test.describe("keyboard navigation", () => {
  test("can tab to input and type", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const input = page.getByPlaceholder("Add a new todo");
    await expect(input).toBeFocused();

    await page.keyboard.type("Keyboard todo");
    await expect(input).toHaveValue("Keyboard todo");
  });

  test("can submit form with Enter key", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Enter submit");
    await page.keyboard.press("Enter");

    await expect(page.getByText("Enter submit")).toBeVisible();
  });

  test("can tab to toggle button and activate with Enter", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Tab todo");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Tab todo")).toBeVisible();

    const toggleBtn = page.getByRole("button", { name: "Mark complete" });
    await toggleBtn.focus();
    await expect(toggleBtn).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();
  });

  test("can tab to delete button and activate with Enter", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Delete via keyboard");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Delete via keyboard")).toBeVisible();

    const deleteBtn = page.getByRole("button", { name: "Delete todo" });
    await deleteBtn.focus();
    await expect(deleteBtn).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page.getByText("Delete via keyboard")).not.toBeVisible();
  });
});

// ─── Semantic structure ──────────────────────────────────────

test.describe("semantic structure", () => {
  test("page has a heading", async ({ page }) => {
    await page.goto("/");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("Todo List");
  });

  test("todos are rendered in a list", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("List item");
    await page.getByRole("button", { name: "Add" }).click();

    const listItem = page.getByRole("listitem");
    await expect(listItem).toBeVisible();
  });

  test("form uses a form element", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("form");
    await expect(form).toBeVisible();
  });
});
