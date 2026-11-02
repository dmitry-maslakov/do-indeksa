import { noop } from "es-toolkit";
import { useSyncExternalStore } from "react";

const lastList = "bank-list";

const subscribe = () => noop;

export const rememberList = (href: string) =>
  sessionStorage.setItem(lastList, href);

export const useListHref = (fallback: string) =>
  useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(lastList) ?? fallback,
    () => fallback,
  );
