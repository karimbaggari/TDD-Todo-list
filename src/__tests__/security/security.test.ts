import path from "path";
import fs from "fs/promises";
import { setDataDir } from "@/helpers/json-store";
import { getTodos, addTodo, toggleTodo, deleteTodo } from "@/app/actions/todo-actions";
import * as repository from "@/repositories/todo.repository";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const TEST_DIR = path.join(process.cwd(), "data-security-test");

function makeFormData(title: string): FormData {
  const fd = new FormData();
  fd.set("title", title);
  return fd;
}

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

// ─── Path traversal ─────────────────────────────────────────

describe("path traversal", () => {
  it("should not read files outside data directory", async () => {
    const result = await repository.getTodoById("../../etc/passwd");
    expect(result).toBeNull();
  });

  it("should not delete files outside data directory", async () => {
    const result = await repository.removeTodo("../package.json");
    // Should either fail safely or not touch the file
    const packageExists = await fs.access(path.join(process.cwd(), "package.json")).then(() => true).catch(() => false);
    expect(packageExists).toBe(true);
  });

  it("should not write files outside data directory via toggle", async () => {
    await expect(toggleTodo("../../malicious")).resolves.toBeUndefined();
  });
});

// ─── Input sanitization ─────────────────────────────────────

describe("input sanitization", () => {
  it("should store script tags as plain text, not execute them", async () => {
    await addTodo(makeFormData('<script>alert("xss")</script>'));

    const todos = await getTodos();
    expect(todos).toHaveLength(1);
    expect(todos[0].title).toBe('<script>alert("xss")</script>');
  });

  it("should handle HTML injection in title", async () => {
    await addTodo(makeFormData('<img src=x onerror="alert(1)">'));

    const todos = await getTodos();
    expect(todos[0].title).toBe('<img src=x onerror="alert(1)">');
  });

  it("should handle very long strings without crashing", async () => {
    const longTitle = "a".repeat(10000);
    await addTodo(makeFormData(longTitle));

    const todos = await getTodos();
    expect(todos).toHaveLength(1);
    expect(todos[0].title).toHaveLength(10000);
  });

  it("should handle special characters in title", async () => {
    await addTodo(makeFormData('Todo with "quotes" and \\backslashes\\ and \nnewlines'));

    const todos = await getTodos();
    expect(todos).toHaveLength(1);
  });

  it("should handle unicode and emoji in title", async () => {
    await addTodo(makeFormData("Café résumé 日本語 🎉"));

    const todos = await getTodos();
    expect(todos[0].title).toBe("Café résumé 日本語 🎉");
  });

  it("should handle null bytes in title", async () => {
    await addTodo(makeFormData("before\x00after"));

    const todos = await getTodos();
    expect(todos).toHaveLength(1);
  });
});

// ─── Data integrity ──────────────────────────────────────────

describe("data integrity", () => {
  it("should handle malformed JSON files gracefully", async () => {
    await fs.writeFile(path.join(TEST_DIR, "corrupt.json"), "not valid json{{{");

    await expect(getTodos()).rejects.toThrow();
  });

  it("should handle empty JSON files gracefully", async () => {
    await fs.writeFile(path.join(TEST_DIR, "empty.json"), "");

    await expect(getTodos()).rejects.toThrow();
  });

  it("should not lose other todos when one file is corrupt", async () => {
    await addTodo(makeFormData("Good todo"));
    await fs.writeFile(path.join(TEST_DIR, "bad.json"), "{broken");

    // Should throw rather than silently skip
    await expect(getTodos()).rejects.toThrow();
  });

  it("should handle concurrent writes to the same todo", async () => {
    await addTodo(makeFormData("Race condition"));
    const [todo] = await getTodos();

    // Toggle the same todo multiple times concurrently
    await Promise.all([
      toggleTodo(todo.id),
      toggleTodo(todo.id),
      toggleTodo(todo.id),
    ]);

    // Should not crash — final state may vary but data should be valid
    const todos = await getTodos();
    expect(todos).toHaveLength(1);
    expect(typeof todos[0].completed).toBe("boolean");
  });
});
