import { addTodo, toggleTodo, deleteTodo } from "@/app/actions/todo-actions";
import * as repository from "@/repositories/todo.repository";
import type { Todo } from "@/types/todo";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/repositories/todo.repository");

const mockedRepo = jest.mocked(repository);

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: "test-id-1",
    title: "Buy milk",
    completed: false,
    completedAt: null,
    createdAt: "2026-05-09T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── adding a todo ──────────────────────────────────────────

describe("adding a todo", () => {
  it("trims whitespace from the title", async () => {
    mockedRepo.createTodo.mockResolvedValue(makeTodo());
    const formData = new FormData();
    formData.set("title", "  Buy milk  ");

    await addTodo(formData);

    expect(mockedRepo.createTodo).toHaveBeenCalledWith("Buy milk");
  });

  it("rejects an empty title", async () => {
    const formData = new FormData();
    formData.set("title", "");

    await addTodo(formData);

    expect(mockedRepo.createTodo).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only title", async () => {
    const formData = new FormData();
    formData.set("title", "   ");

    await addTodo(formData);

    expect(mockedRepo.createTodo).not.toHaveBeenCalled();
  });

  it("rejects a missing title field", async () => {
    const formData = new FormData();

    await addTodo(formData);

    expect(mockedRepo.createTodo).not.toHaveBeenCalled();
  });
});

// ─── toggling a todo ────────────────────────────────────────

describe("toggling a todo", () => {
  it("marks an incomplete todo as complete", async () => {
    const todo = makeTodo({ completed: false });
    mockedRepo.getTodoById.mockResolvedValue(todo);
    mockedRepo.updateTodo.mockResolvedValue({ ...todo, completed: true });

    await toggleTodo(todo.id);

    expect(mockedRepo.updateTodo).toHaveBeenCalledWith(todo.id, { completed: true });
  });

  it("marks a complete todo as incomplete", async () => {
    const todo = makeTodo({ completed: true });
    mockedRepo.getTodoById.mockResolvedValue(todo);
    mockedRepo.updateTodo.mockResolvedValue({ ...todo, completed: false });

    await toggleTodo(todo.id);

    expect(mockedRepo.updateTodo).toHaveBeenCalledWith(todo.id, { completed: false });
  });

  it("silently ignores a non-existent todo", async () => {
    mockedRepo.getTodoById.mockResolvedValue(null);

    await toggleTodo("non-existent-id");

    expect(mockedRepo.updateTodo).not.toHaveBeenCalled();
  });
});

// ─── deleting a todo ────────────────────────────────────────

describe("deleting a todo", () => {
  it("removes the todo by id", async () => {
    mockedRepo.removeTodo.mockResolvedValue(true);

    await deleteTodo("test-id-1");

    expect(mockedRepo.removeTodo).toHaveBeenCalledWith("test-id-1");
  });
});
