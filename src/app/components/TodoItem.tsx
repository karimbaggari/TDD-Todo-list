"use client";

import { toggleTodo, deleteTodo } from "@/app/actions/todo-actions";
import type { Todo } from "@/types/todo";

export default function TodoItem({ todo }: { todo: Todo }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <button
          onClick={() => toggleTodo(todo.id)}
          className={`h-5 w-5 flex-shrink-0 rounded border-2 transition-colors ${
            todo.completed
              ? "border-green-500 bg-green-500 text-white"
              : "border-zinc-300 dark:border-zinc-600"
          } flex items-center justify-center`}
          aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
        >
          {todo.completed && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <span className={todo.completed ? "line-through text-zinc-400" : ""}>
          {todo.title}
        </span>
      </div>
      <button
        onClick={() => deleteTodo(todo.id)}
        className="text-sm text-red-500 hover:text-red-700 transition-colors"
        aria-label="Delete todo"
      >
        Delete
      </button>
    </li>
  );
}
