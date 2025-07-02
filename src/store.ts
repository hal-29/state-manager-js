import { produce, type Draft } from "immer";

// Each handler takes a single object payload (or undefined)
type ActionHandler<T, P = undefined> = (draft: Draft<T>, payload: P) => void;

// Handlers object: { [action: string]: handler }
type ActionHandlers<T> = Record<string, ActionHandler<T, any>>;

// Infer payload type for a given handler
type PayloadOf<H> = H extends ActionHandler<any, infer P> ? P : never;

// Context type now has payload typed as the inferred payload
type Context<P = any> = {
  action: string;
  method?: string;
  payload?: P;
  timestamp: number;
};

type Store<T, H extends ActionHandlers<T>> = {
  getState: () => T;
  subscribe: <K extends keyof H | "*">(
    actionType: K,
    listener: (state: T, context?: Context<PayloadOf<H[K]>>) => void
  ) => () => void;
  dispatch: <K extends keyof H>(
    actionType: K,
    payload: PayloadOf<H[K]>
  ) => void;
  undo: () => boolean;
  redo: () => boolean;
  history: {
    past: () => T[];
    future: () => T[];
  };
};

export function createStore<T, H extends ActionHandlers<T>>(config: {
  initialState: T;
  handlers: H;
}): Store<T, H> {
  let state = config.initialState;
  let history: { past: T[]; future: T[] } = { past: [], future: [] };
  const listeners: Array<{
    actionType: keyof H;
    listener: (state: T, context?: Context<any>) => void;
  }> = [];

  const dispatch: Store<T, H>["dispatch"] = (actionType, payload) => {
    const handler = config.handlers[actionType];
    if (!handler) {
      throw new Error(`Action "${String(actionType)}"does not exist`);
    }

    history = {
      past: [...history.past, state],
      future: [],
    };

    state = produce(state, (draft) => {
      (handler as Function)(draft, payload);
    });

    const Context: Context<typeof payload> = {
      action: "DISPATCH",
      method: String(actionType),
      payload,
      timestamp: Date.now(),
    };

    listeners
      .filter((l) => l.actionType === actionType || l.actionType === "*")
      .forEach((l) => l.listener(state, Context));
  };

  const getState = () => produce(state, (draft) => draft);

  const subscribe: Store<T, H>["subscribe"] = (actionType, listener) => {
    const entry = { actionType, listener };
    listeners.push(entry);
    return () => {
      const index = listeners.indexOf(entry);
      if (index > -1) listeners.splice(index, 1);
    };
  };

  const undo = () => {
    if (history.past.length === 0) return false;
    history.future = [state, ...history.future];
    state = history.past[history.past.length - 1];
    history.past = history.past.slice(0, -1);

    const Context: Context = {
      action: "UNDO",
      timestamp: Date.now(),
    };
    listeners
      .filter((l) => l.actionType === "UNDO" || l.actionType === "*")
      .forEach((l) => l.listener(state, Context));
    return true;
  };

  const redo = () => {
    if (history.future.length === 0) return false;
    history.past = [...history.past, state];
    state = history.future[0];
    history.future = history.future.slice(1);

    const context: Context = {
      action: "REDO",
      timestamp: Date.now(),
    };
    listeners
      .filter((l) => l.actionType === "REDO" || l.actionType === "*")
      .forEach((l) => l.listener(state, context));
    return true;
  };

  return {
    getState,
    subscribe,
    dispatch,
    undo,
    redo,
    history: {
      past: () => produce(history.past, (draft) => draft),
      future: () => produce(history.future, (draft) => draft),
    },
  };
}
