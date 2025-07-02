# Functional State Management Library

A lightweight, type-safe state management solution built on functional programming principles with immutable state updates and time-travel debugging.

## Features

- **Immutable state** using Immer
- **Type-safe** actions and state (TypeScript first)
- **Time-travel debugging** with undo/redo
- **Functional API** with pure reducers
- **Reactive subscriptions** to state changes
- **Minimal boilerplate**
- **Framework agnostic** (works with React, Vue, Svelte, or vanilla JS)

## Installation

```bash
pnpm install
```

## Basic Usage

### Creating a Store

```typescript
import { createStore } from '@your-repo/fp-state';

const store = createStore({
  initialState: { count: 0 },
  handlers: {
    increment: (draft) => {
      draft.count += 1;
    },
    add: (draft, amount: number) => {
      draft.count += amount;
    }
  }
});
```

### Using the Store

```typescript
// Dispatch actions
store.dispatch('increment');
store.dispatch('add', 5);

// Get current state
const state = store.getState();

// Subscribe to changes
store.subscribe('*', (state, context) => {
  console.log('State changed:', state);
  console.log('Action context:', context);
});

// Undo/redo
store.undo();
store.redo();
```

## API Reference

### `createStore(config)`

Creates a new store instance.

**Parameters:**
- `config.initialState`: The initial state object
- `config.handlers`: Action handlers object (shape: `{ [action: string]: (draft, payload) => void }`)

**Returns:** Store instance

### Store API

#### `store.getState()`
Returns a frozen copy of the current state.

#### `store.dispatch(actionType, payload)`
Dispatches an action to update state.

#### `store.subscribe(actionType, listener)`
Subscribes to state changes. Returns unsubscribe function.

- `actionType`: Specific action or `"*"` for all actions
- `listener`: Callback `(state, context) => void`

#### `store.undo()`
Reverts to previous state. Returns `true` if undo was successful.

#### `store.redo()`
Reapplies next state. Returns `true` if redo was successful.

#### `store.history`
- `past()`: Returns array of past states
- `future()`: Returns array of future states

## Core Principles

### 1. Immutability
All state updates are handled immutably using Immer. Your handlers write "mutable" code that gets converted to immutable updates.

### 2. Pure Reducers
Action handlers are pure functions that take current state (draft) and payload, returning nothing (they modify the draft).

### 3. Type Safety
Full TypeScript support with inferred types for:
- State shape
- Action payloads
- Subscription contexts

### 4. Time-Travel
Built-in history tracking enables:
- Undo/redo functionality
- State snapshots
- Action replay

## Architecture

```
Dispatch → Apply Handler → Update State → Notify Subscribers
             ↑
         (Immer draft)
```

## Advanced Patterns

### Composing Handlers

```typescript
const store = createStore({
  initialState: { user: null, todos: [] },
  handlers: {
    login: (draft, user: User) => {
      draft.user = user;
    },
    addTodo: (draft, todo: Todo) => {
      draft.todos.push(todo);
    }
  }
});
```

### Action Metadata

Subscribe to get rich action context:

```typescript
store.subscribe('*', (state, context) => {
  console.log('Action:', context.action); // "DISPATCH", "UNDO", "REDO"
  console.log('Method:', context.method); // action type
  console.log('Payload:', context.payload);
  console.log('Timestamp:', context.timestamp);
});
```

### Middleware (Example)

```typescript
function withLogger(store) {
  const originalDispatch = store.dispatch;
  
  return {
    ...store,
    dispatch: (actionType, payload) => {
      console.log('Dispatching:', actionType, payload);
      originalDispatch(actionType, payload);
    }
  };
}

const loggedStore = withLogger(store);
```

## ebugging Tips

1. **Time-Travel Debugging**:
```typescript
console.log('Past states:', store.history.past());
console.log('Future states:', store.history.future());
```

2. **Action Logging**:
```typescript
store.subscribe('*', (_, context) => {
  console.groupCollapsed(`Action: ${context.method}`);
  console.log('Payload:', context.payload);
  console.log('State:', store.getState());
  console.groupEnd();
});
```

## Benefits

- **Predictable state** - Single source of truth
- **Maintainable** - Clear state transitions
- **Testable** - Pure handlers are easy to test
- **Scalable** - Works for small to large apps
- **Debuggable** - Full action history

## Todo App Example

See the full todo app implementation in the examples folder demonstrating:
- Adding todos
- Toggling completion
- Removing todos
- Clearing all todos
- Undo/redo functionality
- Action logging

---
© 2025 built by [Haileiyesus Mesafint](https://github.com/hal-29) as part of iCog-Labs AGI internship training program. 