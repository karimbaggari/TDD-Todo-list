import crypto from "crypto";
import { readAll, readOne, writeOne, deleteOne } from "@/helpers/json-store";
import type { Todo } from "@/types/todo";

export async function getAllTodos(): Promise<Todo[]> {
  const todos = await readAll<Todo>();
  return todos.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getTodoById(id: string): Promise<Todo | null> {
  return readOne<Todo>(id);
}

export async function createTodo(title: string): Promise<Todo> {
  const todo: Todo = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  await writeOne(todo.id, todo);
  return todo;
}

export async function updateTodo(
  id: string,
  updates: Partial<Pick<Todo, "title" | "completed">>
): Promise<Todo | null> {
  const todo = await getTodoById(id);
  if (!todo) return null;

  if (updates.title !== undefined) {
    if (todo.completed) return null;
    const trimmed = updates.title.trim();
    if (!trimmed) return null;
    updates = { ...updates, title: trimmed };
  }

  const updated = { ...todo, ...updates };
  await writeOne(id, updated);
  return updated;
}

export async function removeTodo(id: string): Promise<boolean> {
  return deleteOne(id);
}
