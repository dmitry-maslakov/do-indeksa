import { clamp } from "es-toolkit";
import { z } from "zod";
import { flush } from "./analytics-browser";
import { text } from "./analytics-schema";
import { secondMs } from "./dates";

const reading = z.strictObject({
  read_id: z.uuid(),
  sections: z.int().min(0),
  sections_reached: z.int().min(0),
  last_section: text.optional(),
  section_ms: z.array(z.int().min(0)).optional(),
  max_scroll_pct: z.int().min(0).max(100),
  visible_ms: z.int().min(0),
  active_ms: z.int().min(0).optional(),
  exit: z.enum(["hidden", "pagehide", "navigate"]),
  seq: z.int().min(1),
});

export const readingProps = reading.shape;

type Reading = z.infer<typeof reading>;

const idleMs = 30 * secondMs;
const activity = ["pointerdown", "pointermove", "keydown", "scroll"];

const visibleNow = () =>
  document.visibilityState === "visible" ? performance.now() : undefined;

export function watchReading(
  node: HTMLElement,
  selector: string,
  report: (reading: Reading, path: string) => void,
) {
  const sections = [...node.querySelectorAll(selector)];
  const path = location.pathname;
  const readId = crypto.randomUUID();
  const sectionMs = sections.map(() => 0);
  const above = (line: number) =>
    sections.filter((section) => section.getBoundingClientRect().top < line)
      .length;
  let seq = 0;
  let depth = 0;
  let reached = 0;
  let current = -1;
  let visibleMs = 0;
  let activeMs = 0;
  let since = visibleNow();
  let activeAt = since;

  const measure = () => {
    const { top, height } = node.getBoundingClientRect();
    depth = Math.max(depth, clamp((innerHeight - top) / height, 0, 1));
    reached = Math.max(reached, above(innerHeight));
    current = above(innerHeight / 2) - 1;
  };
  const act = () => {
    const now = performance.now();
    if (activeAt !== undefined) {
      const spent = Math.min(now - activeAt, idleMs);
      activeMs += spent;
      if (current >= 0) sectionMs[current] = (sectionMs[current] ?? 0) + spent;
    }
    activeAt = since === undefined ? undefined : now;
  };
  const send = (exit: Reading["exit"]) => {
    act();
    if (since !== undefined) visibleMs += performance.now() - since;
    since = undefined;
    activeAt = undefined;
    report(
      {
        read_id: readId,
        sections: sections.length,
        sections_reached: reached,
        last_section: sections[reached - 1]?.id,
        section_ms: sectionMs.map((ms) => Math.round(ms)),
        max_scroll_pct: Math.round(depth * 100),
        visible_ms: Math.round(visibleMs),
        active_ms: Math.round(activeMs),
        exit,
        seq: ++seq,
      },
      path,
    );
  };
  const onVisibility = () => {
    if (document.visibilityState === "hidden") send("hidden");
    else {
      since = visibleNow();
      activeAt = since;
    }
  };
  const onPageHide = () => {
    send("pagehide");
    flush();
  };

  measure();
  const listening = new AbortController();
  const options = { passive: true, signal: listening.signal };
  for (const type of activity) addEventListener(type, act, options);
  addEventListener("scroll", measure, options);
  document.addEventListener("visibilitychange", onVisibility, options);
  addEventListener("pagehide", onPageHide, options);
  return () => {
    listening.abort();
    send("navigate");
  };
}
