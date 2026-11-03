import { useSyncExternalStore } from "react";

const lastList = "bank-list";

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

export const rememberList = (href: string) => {
  sessionStorage.setItem(lastList, href);
  window.dispatchEvent(new StorageEvent("storage", { key: lastList }));
};

export const useListHref = (fallback: string) =>
  useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(lastList) ?? fallback,
    () => fallback,
  );
