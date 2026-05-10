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

test("script tags in todo title are rendered as text, not executed", async ({ page }) => {
  let alertFired = false;
  page.on("dialog", () => {
    alertFired = true;
  });

  await page.goto("/");
  await page.getByPlaceholder("Add a new todo").fill('<script>alert("xss")</script>');
  await page.getByRole("button", { name: "Add" }).click();

  // Wait a moment for any scripts to potentially execute
  await page.waitForTimeout(500);

  expect(alertFired).toBe(false);
});

test("img onerror XSS does not execute", async ({ page }) => {
  let alertFired = false;
  page.on("dialog", () => {
    alertFired = true;
  });

  await page.goto("/");
  await page.getByPlaceholder("Add a new todo").fill('<img src=x onerror="alert(1)">');
  await page.getByRole("button", { name: "Add" }).click();

  await page.waitForTimeout(500);

  expect(alertFired).toBe(false);
});

test("HTML tags in title are not rendered as HTML", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Add a new todo").fill("<b>bold</b>");
  await page.getByRole("button", { name: "Add" }).click();

  // The text should appear as-is, not as bold
  await expect(page.getByText("<b>bold</b>")).toBeVisible();
  const boldElements = page.locator("li b");
  await expect(boldElements).toHaveCount(0);
});
