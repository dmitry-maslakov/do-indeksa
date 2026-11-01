import {
  type MouseEvent,
  type RefObject,
  useLayoutEffect,
  useRef,
} from "react";
import { secondMs } from "@/lib/dates";

const holdMs = 10 * secondMs;
const glideMs = 320;
const anchor = 0.3;

const easeInOut = (k: number) =>
  k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;

const rowOf = (list: HTMLElement, id: string) =>
  list.querySelector<HTMLElement>(`[data-id="${id}"]`);

const anchored = (list: HTMLElement, row: HTMLElement) =>
  row.getBoundingClientRect().top -
  list.getBoundingClientRect().top +
  list.scrollTop -
  anchor * list.clientHeight;

function glide(list: HTMLElement, to: number, frame: RefObject<number>) {
  cancelAnimationFrame(frame.current);
  const from = list.scrollTop;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    list.scrollTop = to;
    return;
  }
  const start = performance.now();
  const tick = (now: number) => {
    const k = Math.min(1, (now - start) / glideMs);
    list.scrollTop = from + (to - from) * easeInOut(k);
    if (k < 1) frame.current = requestAnimationFrame(tick);
  };
  frame.current = requestAnimationFrame(tick);
}

export function useQueueScroll(current: string, next?: string) {
  const list = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const touchedAt = useRef(0);
  const clicked = useRef(false);
  const shown = useRef<{ current: string; next?: string }>(undefined);

  useLayoutEffect(() => {
    const el = list.current;
    const row = el && rowOf(el, current);
    const before = shown.current;
    shown.current = { current, next };
    if (!el || !row || before?.current === current) return;
    if (!before) {
      el.scrollTop = anchored(el, row);
      return;
    }
    const left = rowOf(el, before.current);
    const stepped =
      before.next === current &&
      !clicked.current &&
      Date.now() - touchedAt.current >= holdMs;
    clicked.current = false;
    if (stepped && left) glide(el, el.scrollTop + left.offsetHeight, frame);
  }, [current, next]);

  const touched = () => {
    touchedAt.current = Date.now();
    cancelAnimationFrame(frame.current);
  };

  return {
    list,
    events: {
      onWheel: touched,
      onTouchMove: touched,
      onKeyDown: touched,
      onClickCapture: (event: MouseEvent) => {
        clicked.current =
          event.target instanceof Element &&
          event.target.closest("a:not([aria-current])") !== null;
      },
    },
    back: () => {
      const el = list.current;
      const row = el && rowOf(el, current);
      if (!el || !row) return;
      touchedAt.current = 0;
      glide(el, anchored(el, row), frame);
    },
  };
}
