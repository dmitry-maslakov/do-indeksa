import { type RefObject, useEffect, useLayoutEffect, useRef } from "react";

const glideMs = 320;
const anchor = 0.3;

const easeInOut = (k: number) =>
  k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;

const rowOf = (list: HTMLElement, id: string) =>
  list.querySelector<HTMLElement>(`[data-id="${id}"]`);

const topOf = (list: HTMLElement, row: HTMLElement) =>
  row.getBoundingClientRect().top - list.getBoundingClientRect().top;

const scrollFor = (list: HTMLElement, row: HTMLElement, home: number) =>
  topOf(list, row) + list.scrollTop - home;

interface Motion {
  frame: number;
  home: number;
}

function glide(
  list: HTMLElement,
  row: HTMLElement,
  home: number,
  motion: RefObject<Motion>,
) {
  cancelAnimationFrame(motion.current.frame);
  motion.current = { frame: 0, home };
  const from = list.scrollTop;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    list.scrollTop = scrollFor(list, row, home);
    return;
  }
  const start = performance.now();
  const tick = (now: number) => {
    const k = Math.min(1, (now - start) / glideMs);
    if (row.isConnected)
      list.scrollTop =
        from + (scrollFor(list, row, home) - from) * easeInOut(k);
    motion.current.frame =
      row.isConnected && k < 1 ? requestAnimationFrame(tick) : 0;
  };
  motion.current.frame = requestAnimationFrame(tick);
}

function homeOf(list: HTMLElement, top: number, motion: Motion) {
  if (!motion.frame) return top;
  const room = list.scrollHeight - list.clientHeight - list.scrollTop;
  return Math.max(motion.home, top - room);
}

export function useQueueScroll(current: string) {
  const list = useRef<HTMLDivElement>(null);
  const motion = useRef<Motion>({ frame: 0, home: 0 });
  const shown = useRef<string>(undefined);

  useEffect(() => () => cancelAnimationFrame(motion.current.frame), []);

  useLayoutEffect(() => {
    const el = list.current;
    const row = el && rowOf(el, current);
    const before = shown.current;
    shown.current = current;
    if (!el || !row || before === current) return;
    const home = anchor * el.clientHeight;
    if (!before) {
      el.scrollTop = scrollFor(el, row, home);
      return;
    }
    const left = rowOf(el, before);
    const top = left ? topOf(el, left) : -Infinity;
    const seen = left && top >= 0 && top + left.offsetHeight <= el.clientHeight;
    glide(el, row, seen ? homeOf(el, top, motion.current) : home, motion);
  }, [current]);

  const touched = () => {
    cancelAnimationFrame(motion.current.frame);
    motion.current.frame = 0;
  };

  return {
    list,
    events: { onWheel: touched, onTouchMove: touched, onKeyDown: touched },
    back: () => {
      const el = list.current;
      const row = el && rowOf(el, current);
      if (!el || !row) return;
      glide(el, row, anchor * el.clientHeight, motion);
      row.focus({ preventScroll: true });
    },
  };
}
