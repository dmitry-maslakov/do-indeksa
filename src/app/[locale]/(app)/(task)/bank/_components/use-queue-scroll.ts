import {
  type MouseEvent,
  type RefObject,
  useEffect,
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

export function useQueueScroll(current: string, next?: string) {
  const list = useRef<HTMLDivElement>(null);
  const motion = useRef<Motion>({ frame: 0, home: 0 });
  const touchedAt = useRef(0);
  const clicked = useRef<string>(undefined);
  const shown = useRef<{ current: string; next?: string }>(undefined);

  useEffect(() => () => cancelAnimationFrame(motion.current.frame), []);

  useLayoutEffect(() => {
    const el = list.current;
    const row = el && rowOf(el, current);
    const before = shown.current;
    shown.current = { current, next };
    if (!el || !row || before?.current === current) return;
    if (!before) {
      el.scrollTop = scrollFor(el, row, anchor * el.clientHeight);
      return;
    }
    const left = rowOf(el, before.current);
    const stepped =
      before.next === current &&
      clicked.current !== current &&
      Date.now() - touchedAt.current >= holdMs;
    clicked.current = undefined;
    if (!stepped || !left) return;
    const top = topOf(el, left);
    if (top + left.offsetHeight <= 0 || top >= el.clientHeight) return;
    glide(el, row, homeOf(el, top, motion.current), motion);
  }, [current, next]);

  const touched = () => {
    touchedAt.current = Date.now();
    cancelAnimationFrame(motion.current.frame);
    motion.current.frame = 0;
  };

  return {
    list,
    events: {
      onWheel: touched,
      onTouchMove: touched,
      onKeyDown: touched,
      onClickCapture: (event: MouseEvent) => {
        if (event.target instanceof Element)
          clicked.current =
            event.target.closest<HTMLElement>("a[data-id]")?.dataset.id;
      },
    },
    back: () => {
      const el = list.current;
      const row = el && rowOf(el, current);
      if (!el || !row) return;
      touchedAt.current = 0;
      glide(el, row, anchor * el.clientHeight, motion);
      row.focus({ preventScroll: true });
    },
  };
}
