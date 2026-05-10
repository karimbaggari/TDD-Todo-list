import { getAllTodos, getTodoById, createTodo, updateTodo, removeTodo } from "@/repositories/todo.repository";
import * as jsonStore from "@/helpers/json-store";
import type { Todo } from "@/types/todo";

jest.mock("@/helpers/json-store");

const mockedStore = jest.mocked(jsonStore);

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: "test-id-1",
    title: "Buy milk",
    completed: false,
    createdAt: "2026-05-09T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── creating a todo ────────────────────────────────────────

describe("creating a todo", () => {
  beforeEach(() => {
    mockedStore.writeOne.mockResolvedValue();
  });

  it("is always incomplete when first created", async () => {
    const result = await createTodo("Buy milk");

    expect(result.completed).toBe(false);
  });

  it("preserves the given title", async () => {
    const result = await createTodo("Buy milk");

    expect(result.title).toBe("Buy milk");
  });

  it("assigns a unique identifier", async () => {
    const result = await createTodo("Buy milk");

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("string");
  });

  it("records when it was created", async () => {
    const result = await createTodo("Buy milk");

    expect(result.createdAt).toBeDefined();
    expect(new Date(result.createdAt).toISOString()).toBe(result.createdAt);
  });

  it("persists to storage", async () => {
    const result = await createTodo("Buy milk");

    expect(mockedStore.writeOne).toHaveBeenCalledWith(result.id, result);
  });
});

// ─── retrieving todos ───────────────────────────────────────

describe("retrieving todos", () => {
  it("returns todos sorted newest first", async () => {
    const older = makeTodo({ id: "1", createdAt: "2026-05-01T00:00:00.000Z" });
    const newer = makeTodo({ id: "2", createdAt: "2026-05-09T00:00:00.000Z" });
    mockedStore.readAll.mockResolvedValue([older, newer]);

    const result = await getAllTodos();

    expect(result).toEqual([newer, older]);
  });

  it("returns an empty list when none exist", async () => {
    mockedStore.readAll.mockResolvedValue([]);

    const result = await getAllTodos();

    expect(result).toEqual([]);
  });

  it("finds a specific todo by id", async () => {
    const todo = makeTodo();
    mockedStore.readOne.mockResolvedValue(todo);

    const result = await getTodoById("test-id-1");

    expect(result).toEqual(todo);
  });

  it("returns null for a non-existent id", async () => {
    mockedStore.readOne.mockResolvedValue(null);

    const result = await getTodoById("non-existent");

    expect(result).toBeNull();
  });
});

// ─── updating a todo ────────────────────────────────────────

describe("updating a todo", () => {
  it("can change the title", async () => {
    const todo = makeTodo();
    mockedStore.readOne.mockResolvedValue(todo);
    mockedStore.writeOne.mockResolvedValue();

    const result = await updateTodo("test-id-1", { title: "Updated" });

    expect(result!.title).toBe("Updated");
    expect(result!.completed).toBe(false);
  });

  it("can mark as completed", async () => {
    const todo = makeTodo();
    mockedStore.readOne.mockResolvedValue(todo);
    mockedStore.writeOne.mockResolvedValue();

    const result = await updateTodo("test-id-1", { completed: true });

    expect(result!.completed).toBe(true);
    expect(result!.title).toBe("Buy milk");
  });

  it("trims whitespace from an updated title", async () => {
    const todo = makeTodo();
    mockedStore.readOne.mockResolvedValue(todo);
    mockedStore.writeOne.mockResolvedValue();

    const result = await updateTodo("test-id-1", { title: "  Updated  " });

    expect(result!.title).toBe("Updated");
  });

  it("rejects an empty title", async () => {
    const todo = makeTodo();
    mockedStore.readOne.mockResolvedValue(todo);

    const result = await updateTodo("test-id-1", { title: "" });

    expect(result).toBeNull();
    expect(mockedStore.writeOne).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only title", async () => {
    const todo = makeTodo();
    mockedStore.readOne.mockResolvedValue(todo);

    const result = await updateTodo("test-id-1", { title: "   " });

    expect(result).toBeNull();
    expect(mockedStore.writeOne).not.toHaveBeenCalled();
  });

  it("persists the changes", async () => {
    const todo = makeTodo();
    mockedStore.readOne.mockResolvedValue(todo);
    mockedStore.writeOne.mockResolvedValue();

    const result = await updateTodo("test-id-1", { completed: true });

    expect(mockedStore.writeOne).toHaveBeenCalledWith("test-id-1", result);
  });

  it("returns null for a non-existent todo", async () => {
    mockedStore.readOne.mockResolvedValue(null);

    const result = await updateTodo("non-existent", { title: "Nope" });

    expect(result).toBeNull();
    expect(mockedStore.writeOne).not.toHaveBeenCalled();
  });
});

// ─── removing a todo ────────────────────────────────────────

describe("removing a todo", () => {
  it("deletes the todo and confirms success", async () => {
    mockedStore.deleteOne.mockResolvedValue(true);

    const result = await removeTodo("test-id-1");

    expect(mockedStore.deleteOne).toHaveBeenCalledWith("test-id-1");
    expect(result).toBe(true);
  });

  it("reports failure for a non-existent todo", async () => {
    mockedStore.deleteOne.mockResolvedValue(false);

    const result = await removeTodo("non-existent");

    expect(result).toBe(false);
  });
});
