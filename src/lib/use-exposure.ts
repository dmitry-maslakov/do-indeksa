import { useRouter } from "next/navigation";
import { observe } from "react-intersection-observer";
import {
  type BrowserEvents,
  queueEvent,
  shownAttribute,
} from "./analytics-browser";

type Shown = {
  [Name in keyof BrowserEvents]: "shown_id" extends keyof BrowserEvents[Name]
    ? Name
    : never;
}[keyof BrowserEvents];

const exposed = new Map<string, string>();

const pageOf = (entry?: NavigationHistoryEntry) => entry?.url?.split("#")[0];

export function viewKey(bfcacheId: string, subject: string) {
  const entries = globalThis.navigation?.entries() ?? [];
  let index = globalThis.navigation?.currentEntry?.index ?? -1;
  while (index > 0 && pageOf(entries[index - 1]) === pageOf(entries[index]))
    index--;
  return `${entries[index]?.key ?? bfcacheId} ${subject}`;
}

export function useExposure<Name extends Shown>(
  name: Name,
  props?: BrowserEvents[Name],
  page = "",
) {
  const { bfcacheId } = useRouter();

  return (node: Element | null) => {
    if (!node || !props) return;
    const stop = observe(
      node,
      (inView) => {
        if (!inView) return;
        stop();
        const key = viewKey(
          bfcacheId,
          `${name} ${page} ${JSON.stringify(props)}`,
        );
        const before = exposed.get(key);
        const id = before ?? crypto.randomUUID();
        node.setAttribute(shownAttribute, id);
        if (before) return;
        exposed.set(key, id);
        queueEvent(name, { ...props, shown_id: id });
      },
      { threshold: 0.5 },
    );
    return stop;
  };
}
