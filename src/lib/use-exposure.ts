import { useRouter } from "next/navigation";
import { useOnInView } from "react-intersection-observer";
import { type BrowserEvents, queueEvent } from "./analytics-browser";

const exposed = new Set<string>();

const pageOf = (entry?: NavigationHistoryEntry) => entry?.url?.split("#")[0];

export function viewKey(bfcacheId: string, subject: string) {
  const entries = globalThis.navigation?.entries() ?? [];
  let index = globalThis.navigation?.currentEntry?.index ?? -1;
  while (index > 0 && pageOf(entries[index - 1]) === pageOf(entries[index]))
    index--;
  return `${entries[index]?.key ?? bfcacheId} ${subject}`;
}

export function useExposure<Name extends keyof BrowserEvents>(
  name: Name,
  props?: BrowserEvents[Name],
) {
  const { bfcacheId } = useRouter();
  return useOnInView(
    (inView) => {
      const key = viewKey(bfcacheId, `${name} ${JSON.stringify(props)}`);
      if (!inView || !props || exposed.has(key)) return;
      exposed.add(key);
      queueEvent(name, props);
    },
    { threshold: 0.5, triggerOnce: true, skip: !props },
  );
}
