import { getTodos } from "@/app/actions/todo-actions";
import AddTodoForm from "@/app/components/AddTodoForm";
import TodoItem from "@/app/components/TodoItem";

export default async function Home() {
  const todos = await getTodos();

  return (
    <div className="flex flex-1 items-start justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <main className="w-full max-w-lg">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">Todo List</h1>
        <AddTodoForm />
        <ul className="mt-6 flex flex-col gap-2">
          {todos.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-400">
              No todos yet. Add one above.
            </p>
          )}
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      </main>
    </div>
  );
}
