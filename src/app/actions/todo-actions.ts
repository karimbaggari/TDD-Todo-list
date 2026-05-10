"use server";

import { revalidatePath } from "next/cache";
import { getAllTodos, createTodo, getTodoById, updateTodo, removeTodo } from "@/repositories/todo.repository";
import type { Todo } from "@/types/todo";

export async function getTodos(): Promise<Todo[]> {
  return getAllTodos();
}

export async function addTodo(formData: FormData): Promise<void> {
  const title = formData.get("title") as string;
  if (!title || !title.trim()) return;

  await createTodo(title.trim());
  revalidatePath("/");
}

export async function toggleTodo(id: string): Promise<void> {
  const todo = await getTodoById(id);
  if (!todo) return;

  await updateTodo(id, { completed: !todo.completed });
  revalidatePath("/");
}

export async function deleteTodo(id: string): Promise<void> {
  await removeTodo(id);
  revalidatePath("/");
}
