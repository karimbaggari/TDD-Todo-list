import path from "path";
import fs from "fs/promises";
import { setDataDir } from "@/helpers/json-store";
import { getTodos, addTodo, toggleTodo, deleteTodo } from "@/app/actions/todo-actions";

// Mock only revalidatePath — it's a Next.js runtime concern, not part of our logic
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const TEST_DIR = path.join(process.cwd(), "data-integration-test");

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

function makeFormData(title: string): FormData {
  const fd = new FormData();
  fd.set("title", title);
  return fd;
}

// ─── addTodo + getTodos ──────────────────────────────────────

describe("addTodo + getTodos", () => {
  it("should create a todo and retrieve it", async () => {
    await addTodo(makeFormData("Buy milk"));

    const todos = await getTodos();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toBe("Buy milk");
    expect(todos[0].completed).toBe(false);
  });

  it("should create multiple todos and retrieve them all", async () => {
    await addTodo(makeFormData("First"));
    await addTodo(makeFormData("Second"));
    await addTodo(makeFormData("Third"));

    const todos = await getTodos();

    expect(todos).toHaveLength(3);
  });

  it("should return todos sorted newest first", async () => {
    await addTodo(makeFormData("First"));
    await new Promise((r) => setTimeout(r, 10));
    await addTodo(makeFormData("Second"));
    await new Promise((r) => setTimeout(r, 10));
    await addTodo(makeFormData("Third"));

    const todos = await getTodos();

    expect(todos[0].title).toBe("Third");
    expect(todos[2].title).toBe("First");
  });

  it("should not create a todo with empty title", async () => {
    await addTodo(makeFormData(""));

    const todos = await getTodos();

    expect(todos).toHaveLength(0);
  });

  it("should not create a todo with whitespace-only title", async () => {
    await addTodo(makeFormData("   "));

    const todos = await getTodos();

    expect(todos).toHaveLength(0);
  });

  it("should trim the title", async () => {
    await addTodo(makeFormData("  Buy milk  "));

    const todos = await getTodos();

    expect(todos[0].title).toBe("Buy milk");
  });
});

// ─── toggleTodo ──────────────────────────────────────────────

describe("toggleTodo", () => {
  it("should toggle a todo from incomplete to complete", async () => {
    await addTodo(makeFormData("Buy milk"));
    const [todo] = await getTodos();

    await toggleTodo(todo.id);

    const [updated] = await getTodos();
    expect(updated.completed).toBe(true);
    expect(updated.completedAt).not.toBeNull();
  });

  it("should toggle a todo back to incomplete", async () => {
    await addTodo(makeFormData("Buy milk"));
    const [todo] = await getTodos();

    await toggleTodo(todo.id);
    await toggleTodo(todo.id);

    const [updated] = await getTodos();
    expect(updated.completed).toBe(false);
    expect(updated.completedAt).toBeNull();
  });

  it("should not crash when toggling a non-existent id", async () => {
    await expect(toggleTodo("non-existent")).resolves.toBeUndefined();
  });
});

// ─── deleteTodo ──────────────────────────────────────────────

describe("deleteTodo", () => {
  it("should delete a todo", async () => {
    await addTodo(makeFormData("Buy milk"));
    const [todo] = await getTodos();

    await deleteTodo(todo.id);

    const todos = await getTodos();
    expect(todos).toHaveLength(0);
  });

  it("should only delete the targeted todo", async () => {
    await addTodo(makeFormData("First"));
    await addTodo(makeFormData("Second"));
    const todos = await getTodos();

    await deleteTodo(todos[0].id);

    const remaining = await getTodos();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(todos[1].id);
  });

  it("should not crash when deleting a non-existent id", async () => {
    await expect(deleteTodo("non-existent")).resolves.toBeUndefined();
  });
});

// ─── full lifecycle ──────────────────────────────────────────

describe("full lifecycle", () => {
  it("should create, toggle, and delete a todo", async () => {
    await addTodo(makeFormData("Buy milk"));
    let todos = await getTodos();
    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toBe(false);

    await toggleTodo(todos[0].id);
    todos = await getTodos();
    expect(todos[0].completed).toBe(true);

    await deleteTodo(todos[0].id);
    todos = await getTodos();
    expect(todos).toHaveLength(0);
  });
});
