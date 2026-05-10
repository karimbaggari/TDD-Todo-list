import crypto from "crypto";
import { readAll, readOne, writeOne, deleteOne } from "@/helpers/json-store";
import type { Todo } from "@/types/todo";

export async function getAllTodos(): Promise<Todo[]> {
  return [];
}

export async function getTodoById(id: string): Promise<Todo | null> {
  return null;
}

export async function createTodo(title: string): Promise<Todo> {
  throw new Error("Not implemented");
}

export async function updateTodo(
  id: string,
  updates: Partial<Pick<Todo, "title" | "completed">>
): Promise<Todo | null> {
  return null;
}

export async function removeTodo(id: string): Promise<boolean> {
  return false;
}
