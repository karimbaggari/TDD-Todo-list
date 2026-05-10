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

// ─── viewing the todo list ──────────────────────────────────

test.describe("viewing the todo list", () => {
  test("shows the page heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Todo List" })).toBeVisible();
  });

  test("shows an empty state when no todos exist", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("No todos yet. Add one above.")).toBeVisible();
  });
});

// ─── adding a todo ──────────────────────────────────────────

test.describe("adding a todo", () => {
  test("appears in the list after submission", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Buy milk");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("Buy milk")).toBeVisible();
    await expect(page.getByText("No todos yet")).not.toBeVisible();
  });

  test("clears the input for the next entry", async ({ page }) => {
    await page.goto("/");
    const input = page.getByPlaceholder("Add a new todo");
    await input.fill("Buy milk");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("Buy milk")).toBeVisible();
    await expect(input).toHaveValue("");
  });

  test("supports adding multiple todos", async ({ page }) => {
    await page.goto("/");
    const input = page.getByPlaceholder("Add a new todo");

    await input.fill("First");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("First")).toBeVisible();

    await input.fill("Second");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Second")).toBeVisible();
  });
});

// ─── completing a todo ──────────────────────────────────────

test.describe("completing a todo", () => {
  test("shows a visual indicator when marked done", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Finish report");
    await page.getByRole("button", { name: "Add" }).click();

    await page.getByRole("button", { name: "Mark complete" }).click();

    await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();
    const todoText = page.locator("span", { hasText: "Finish report" });
    await expect(todoText).toHaveClass(/line-through/);
  });

  test("can be undone", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Undo this");
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();

    await page.getByRole("button", { name: "Mark incomplete" }).click();

    await expect(page.getByRole("button", { name: "Mark complete" })).toBeVisible();
    const todoText = page.locator("span", { hasText: "Undo this" });
    await expect(todoText).not.toHaveClass(/line-through/);
  });
});

// ─── deleting a todo ────────────────────────────────────────

test.describe("deleting a todo", () => {
  test("removes it from the list", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Remove me");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Remove me")).toBeVisible();

    await page.getByRole("button", { name: "Delete todo" }).click();

    await expect(page.getByText("Remove me")).not.toBeVisible();
    await expect(page.getByText("No todos yet")).toBeVisible();
  });
});

// ─── persistence ────────────────────────────────────────────

test.describe("persistence", () => {
  test("todos survive page navigation", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Remember me");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Remember me")).toBeVisible();

    await page.close();
    const newPage = await page.context().newPage();
    await newPage.goto("/");

    await expect(newPage.getByText("Remember me")).toBeVisible();
  });

  test("completion status survives page reload", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Stay done");
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();

    await page.reload();

    const todoText = page.getByText("Stay done");
    await expect(todoText).toHaveClass(/line-through/);
  });
});
