export const MOCK_GENERATED_CODE = `import { useState } from "react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Learn React", completed: true },
    { id: 2, text: "Build a todo app", completed: false },
    { id: 3, text: "Deploy to production", completed: false },
  ]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos(prev => [
      ...prev,
      { id: Date.now(), text: input, completed: false },
    ]);
    setInput("");
  };

  const toggleTodo = (id: number) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-bold">Todo App</h1>
      <div className="mb-4 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTodo()}
          placeholder="Add a new todo..."
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          onClick={addTodo}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {todos.map(todo => (
          <li
            key={todo.id}
            onClick={() => toggleTodo(todo.id)}
            className="flex cursor-pointer items-center gap-2 rounded border p-3 hover:bg-gray-50"
          >
            <span className={todo.completed ? "text-green-500" : "text-gray-300"}>
              {todo.completed ? "\u2713" : "\u25CB"}
            </span>
            <span className={todo.completed ? "line-through text-gray-400" : ""}>
              {todo.text}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-gray-500">
        {todos.filter(t => !t.completed).length} items remaining
      </p>
    </div>
  );
}`;

export const MOCK_PROMPT_HISTORY = [
	"Build a todo app with add, toggle, and delete functionality",
];

export const MOCK_PREVIEW_HTML = `
<div style="max-width:28rem;margin:0 auto;padding:1.5rem;font-family:system-ui">
  <h1 style="font-size:1.5rem;font-weight:bold;margin-bottom:1rem">Todo App</h1>
  <div style="display:flex;gap:0.5rem;margin-bottom:1rem">
    <input placeholder="Add a new todo..." style="flex:1;border:1px solid #d1d5db;border-radius:0.375rem;padding:0.5rem 0.75rem" />
    <button style="background:#3b82f6;color:white;padding:0.5rem 1rem;border-radius:0.375rem;border:none">Add</button>
  </div>
  <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:0.5rem">
    <li style="display:flex;align-items:center;gap:0.5rem;border:1px solid #e5e7eb;border-radius:0.375rem;padding:0.75rem;cursor:pointer">
      <span style="color:#22c55e">\u2713</span>
      <span style="text-decoration:line-through;color:#9ca3af">Learn React</span>
    </li>
    <li style="display:flex;align-items:center;gap:0.5rem;border:1px solid #e5e7eb;border-radius:0.375rem;padding:0.75rem;cursor:pointer">
      <span style="color:#d1d5db">\u25CB</span>
      <span>Build a todo app</span>
    </li>
    <li style="display:flex;align-items:center;gap:0.5rem;border:1px solid #e5e7eb;border-radius:0.375rem;padding:0.75rem;cursor:pointer">
      <span style="color:#d1d5db">\u25CB</span>
      <span>Deploy to production</span>
    </li>
  </ul>
  <p style="margin-top:1rem;font-size:0.875rem;color:#6b7280">2 items remaining</p>
</div>`;
