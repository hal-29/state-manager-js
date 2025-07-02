import { createStore } from "./store";

const todoForm = document.getElementById("todoForm") as HTMLFormElement;
const todoInput = document.getElementById("todoInput") as HTMLInputElement;
const undoBtn = document.getElementById("undoBtn") as HTMLButtonElement;
const redoBtn = document.getElementById("redoBtn") as HTMLButtonElement;
const clearBtn = document.getElementById("clearBtn") as HTMLButtonElement;
const todoListDisplay = document.getElementById("todoList") as HTMLUListElement;
const currentStateDisplay = document.getElementById(
  "currentState"
) as HTMLDivElement;
const actionLogDisplay = document.getElementById("actionLog") as HTMLDivElement;
const pastHistoryDisplay = document.getElementById(
  "pastHistory"
) as HTMLDivElement;
const futureHistoryDisplay = document.getElementById(
  "futureHistory"
) as HTMLDivElement;

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

const store = createStore({
  initialState: {
    todos: [] as Todo[],
  },
  handlers: {
    addTodo: (draft, paylaod: { text: string }) => {
      const newTodo: Todo = {
        id: Date.now(),
        text: paylaod.text,
        completed: false,
      };
      draft.todos.push(newTodo);
    },
    toggleTodo: (draft, payload: { id: number }) => {
      const todo = draft.todos.find((t) => t.id === payload.id);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    removeTodo: (draft, payload: { id: number }) => {
      draft.todos = draft.todos.filter((t) => t.id !== payload.id);
    },
    clearTodos: (draft) => {
      draft.todos = [];
    },
  },
});

// Logger for all actions
store.subscribe("*", (_, context) => {
  const el = document.createElement("div");
  el.textContent = `[${new Date(
    context?.timestamp || ""
  ).toLocaleTimeString()} : ${context?.action} ] - ${
    context?.method || "N/A"
  } - ${context?.payload ? JSON.stringify(context.payload) : "No Payload"}`;

  actionLogDisplay.appendChild(el);
  actionLogDisplay.scrollTop = actionLogDisplay.scrollHeight;
});

todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (text) {
    store.dispatch("addTodo", { text });
    todoInput.value = "";
  }
});

undoBtn.addEventListener("click", () => {
  store.undo();
});

redoBtn.addEventListener("click", () => {
  store.redo();
});

clearBtn.addEventListener("click", () => {
  store.dispatch("clearTodos", {});
});

function renderTodos(todoList: Todo[]) {
  const list = todoList.map((todo) => {
    const el = document.createElement("div");
    el.className = "flex items-center p-3 hover:bg-gray-50 rounded-lg";

    const inp = document.createElement("input");
    inp.type = "checkbox";
    inp.checked = todo.completed;
    inp.className =
      "todo-toggle h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 mr-3";

    const span = document.createElement("span");
    span.className = todo.completed
      ? "line-through text-gray-400 flex-1"
      : "text-gray-800 flex-1";
    span.textContent = todo.text;

    const btn = document.createElement("button");
    btn.className =
      "todo-remove text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50";
    btn.textContent = "✕";
    btn.dataset.id = String(todo.id);
    btn.addEventListener("click", () => {
      store.dispatch("removeTodo", { id: todo.id });
    });

    inp.addEventListener("change", () => {
      store.dispatch("toggleTodo", { id: todo.id });
    });

    el.appendChild(inp);
    el.appendChild(span);
    el.appendChild(btn);

    return el;
  });

  todoList.length === 0
    ? (todoListDisplay.innerHTML = `            <div class="text-center py-8 text-gray-400">
              <p>No todos yet</p>
              <p class="text-xs mt-1">Add your first todo above</p>
            </div>`)
    : todoListDisplay.replaceChildren(...list);

  todoListDisplay.scrollTop = todoListDisplay.scrollHeight;
}

function renderHistoryStack(
  past: { todos: Todo[] }[],
  future: { todos: Todo[] }[]
) {
  if (past.length === 0) {
    pastHistoryDisplay.innerHTML = `<div class="p-2 text-sm text-gray-500">No history yet</div>`;
  } else {
    const pastItems = past.map((todo) => {
      const el = document.createElement("pre");
      el.className = "p-2 text-sm text-gray-700";
      el.textContent = JSON.stringify(todo.todos, null, 2);
      return el;
    });
    pastHistoryDisplay.replaceChildren(...pastItems);
  }

  if (future.length === 0) {
    futureHistoryDisplay.innerHTML = `<div class="p-2 text-sm text-gray-500">No future history</div>`;
  } else {
    const futureItems = future.map((todo) => {
      const el = document.createElement("div");
      el.className = "p-2 text-sm text-gray-500";
      el.textContent = JSON.stringify(todo.todos, null, 2);
      return el;
    });
    futureHistoryDisplay.replaceChildren(...futureItems);
  }
}

store.subscribe("*", (state) => {
  renderTodos(state.todos);
  currentStateDisplay.textContent = JSON.stringify(state, null, 2);
  const pastHistory = store.history.past();
  const futureHistory = store.history.future();
  renderHistoryStack(pastHistory, futureHistory);

  // update button states if history is empty
  undoBtn.disabled = pastHistory.length === 0;
  redoBtn.disabled = futureHistory.length === 0;
});
