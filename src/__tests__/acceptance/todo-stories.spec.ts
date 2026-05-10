/**
 * ACCEPTANCE TESTS — "Does the feature satisfy the user story?"
 *
 * When acceptance tests earn their place:
 * - When product stakeholders define acceptance criteria BEFORE development.
 *   The test file becomes a contract between engineering and product.
 * - When using BDD frameworks (Cucumber, SpecFlow) with Gherkin syntax
 *   (Given/When/Then) so non-engineers can read and validate the specs.
 * - When acceptance criteria encode BUSINESS rules that aren't obvious
 *   from the UI flow (e.g., "a manager can approve, but not their own request").
 *
 * In THIS project: Compare the describe blocks here with e2e/todo.spec.ts.
 * The user-story framing ("As a user, I can mark a todo as done") is valuable —
 * but it should live IN the E2E tests, not alongside them in a separate file.
 * That's why e2e/todo.spec.ts now uses the same user-story-style describes.
 *
 * What IS unique here: The persistence tests ("my todos are saved") test a
 * real user concern that pure CRUD E2E tests often miss.
 *
 * Student exercise: Ask yourself — if a product manager read only THIS file,
 * would they understand what the app does? That's the acceptance test standard.
 */
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

// ─── Story: I can see my todo list ───────────────────────────

test.describe("As a user, I can see my todo list", () => {
  test("I see the todo list page with a clear heading", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Todo List" })).toBeVisible();
  });

  test("I see an empty state message when I have no todos", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("No todos yet. Add one above.")).toBeVisible();
  });

  test("I see my existing todos listed", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Buy groceries");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Buy groceries")).toBeVisible();

    await page.getByPlaceholder("Add a new todo").fill("Walk the dog");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Walk the dog")).toBeVisible();
  });
});

// ─── Story: I can add a todo ─────────────────────────────────

test.describe("As a user, I can add a todo", () => {
  test("I type a title and submit, it appears in my list", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("Add a new todo").fill("Learn testing");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("Learn testing")).toBeVisible();
    await expect(page.getByText("No todos yet")).not.toBeVisible();
  });

  test("the input clears after I add a todo so I can add another", async ({ page }) => {
    await page.goto("/");

    const input = page.getByPlaceholder("Add a new todo");
    await input.fill("First task");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("First task")).toBeVisible();
    await expect(input).toHaveValue("");
  });
});

// ─── Story: I can mark a todo as done ────────────────────────

test.describe("As a user, I can mark a todo as done", () => {
  test("I click the checkbox and it shows as completed", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Finish report");
    await page.getByRole("button", { name: "Add" }).click();

    await page.getByRole("button", { name: "Mark complete" }).click();

    const todoText = page.locator("span", { hasText: "Finish report" });
    await expect(todoText).toHaveClass(/line-through/);
  });
});

// ─── Story: I can unmark a todo ──────────────────────────────

test.describe("As a user, I can unmark a todo", () => {
  test("I click a completed todo and it goes back to incomplete", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Undo this");
    await page.getByRole("button", { name: "Add" }).click();

    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();

    await page.getByRole("button", { name: "Mark incomplete" }).click();

    const todoText = page.locator("span", { hasText: "Undo this" });
    await expect(todoText).not.toHaveClass(/line-through/);
    await expect(page.getByRole("button", { name: "Mark complete" })).toBeVisible();
  });
});

// ─── Story: I can delete a todo ──────────────────────────────

test.describe("As a user, I can delete a todo", () => {
  test("I click delete and the todo is removed from my list", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Remove me");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Remove me")).toBeVisible();

    await page.getByRole("button", { name: "Delete todo" }).click();

    await expect(page.getByText("Remove me")).not.toBeVisible();
    await expect(page.getByText("No todos yet")).toBeVisible();
  });
});

// ─── Story: My todos are saved ───────────────────────────────

test.describe("As a user, my todos are saved", () => {
  test("I add a todo, close the page, come back, and it is still there", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Add a new todo").fill("Remember me");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Remember me")).toBeVisible();

    await page.close();

    const newPage = await page.context().newPage();
    await newPage.goto("/");

    await expect(newPage.getByText("Remember me")).toBeVisible();
  });

  test("I complete a todo, reload, and it is still completed", async ({ page }) => {
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
