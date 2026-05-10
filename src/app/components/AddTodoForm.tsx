"use client";

import { useRef } from "react";
import { addTodo } from "@/app/actions/todo-actions";

export default function AddTodoForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    await addTodo(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-2">
      <input
        type="text"
        name="title"
        placeholder="Add a new todo..."
        required
        className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
      />
      <button
        type="submit"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Add
      </button>
    </form>
  );
}
