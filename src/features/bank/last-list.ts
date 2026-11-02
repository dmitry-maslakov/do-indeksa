import { useSyncExternalStore } from "react";

const lastList = "bank-list";

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const rememberList = (href: string) => {
  sessionStorage.setItem(lastList, href);
  for (const listener of listeners) listener();
};

export const useListHref = (fallback: string) =>
  useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(lastList) ?? fallback,
    () => fallback,
  );
