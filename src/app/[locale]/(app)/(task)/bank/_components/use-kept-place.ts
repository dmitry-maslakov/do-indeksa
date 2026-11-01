import { type RefObject, useEffect, useLayoutEffect, useRef } from "react";

const offsetIn = (content: HTMLElement, mark: HTMLElement) =>
  mark.getBoundingClientRect().top - content.getBoundingClientRect().top;

const contentOf = (list: HTMLElement | null) => {
  const content = list?.firstElementChild;
  return content instanceof HTMLElement ? content : null;
};

interface Held {
  mark: HTMLElement;
  at: number;
}

function hold(el: HTMLElement, here: HTMLElement, held: Held | null) {
  const content = contentOf(el);
  if (!content) return;
  const room = offsetIn(content, here);
  content.style.minHeight = room > 0 ? `${room + el.clientHeight}px` : "";
  if (held?.mark.isConnected)
    el.scrollTop += offsetIn(content, held.mark) - held.at;
  return offsetIn(content, here);
}

// Keeps the start of the current session where it is on screen while the
// earlier groups above it load, unload, open and close. keepAt holds another
// element instead for the next change, so a toggled heading stays put.
export function useKeptPlace(list: RefObject<HTMLElement | null>) {
  const here = useRef<HTMLDivElement>(null);
  const held = useRef<Held | null>(null);

  useLayoutEffect(() => {
    const el = list.current;
    const mark = here.current;
    if (!el || !mark) return;
    const at = hold(el, mark, held.current);
    held.current = at === undefined ? null : { mark, at };
  });

  useEffect(() => {
    const el = list.current;
    return () => {
      const content = contentOf(el);
      if (content) content.style.minHeight = "";
    };
  }, [list]);

  const keepAt = (mark: HTMLElement) => {
    const content = contentOf(list.current);
    if (content) held.current = { mark, at: offsetIn(content, mark) };
  };

  return { here, keepAt };
}
