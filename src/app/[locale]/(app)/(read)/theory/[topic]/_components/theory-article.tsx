"use client";

import { clamp } from "es-toolkit";
import { type ReactNode, useEffect, useRef } from "react";
import { type BrowserEvents, flush, queueEvent } from "@/lib/analytics-browser";
import { secondMs } from "@/lib/dates";

type Read = BrowserEvents["theory_read"];
type Reading = Pick<Read, "topic" | "method" | "page">;

interface TheoryArticleProps extends Reading {
  className: string;
  children: ReactNode;
}

const idleMs = 30 * secondMs;
const activity = ["pointerdown", "pointermove", "keydown", "scroll"];

const visibleNow = () =>
  document.visibilityState === "visible" ? performance.now() : undefined;

function watchReading(node: HTMLElement, reading: Reading) {
  const headings = [...node.querySelectorAll("h2[id]")];
  const path = location.pathname;
  const readId = crypto.randomUUID();
  let seq = 0;
  let depth = 0;
  let reached = 0;
  let visibleMs = 0;
  let activeMs = 0;
  let since = visibleNow();
  let activeAt = since;

  const measure = () => {
    const { top, height } = node.getBoundingClientRect();
    depth = Math.max(depth, clamp((innerHeight - top) / height, 0, 1));
    reached = Math.max(
      reached,
      headings.filter((h) => h.getBoundingClientRect().top < innerHeight)
        .length,
    );
  };
  const act = () => {
    const now = performance.now();
    if (activeAt !== undefined) activeMs += Math.min(now - activeAt, idleMs);
    activeAt = since === undefined ? undefined : now;
  };
  const send = (exit: Read["exit"]) => {
    act();
    if (since !== undefined) visibleMs += performance.now() - since;
    since = undefined;
    activeAt = undefined;
    queueEvent(
      "theory_read",
      {
        ...reading,
        read_id: readId,
        sections: headings.length,
        sections_reached: reached,
        last_section: headings[reached - 1]?.id,
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
  addEventListener("scroll", measure, options);
  for (const type of activity) addEventListener(type, act, options);
  document.addEventListener("visibilitychange", onVisibility, options);
  addEventListener("pagehide", onPageHide, options);
  return () => {
    listening.abort();
    send("navigate");
  };
}

export function TheoryArticle({
  topic,
  method,
  page,
  className,
  children,
}: TheoryArticleProps) {
  const article = useRef<HTMLElement>(null);

  useEffect(() => {
    if (article.current)
      return watchReading(article.current, { topic, method, page });
  }, [topic, method, page]);

  return (
    <article ref={article} className={className}>
      {children}
    </article>
  );
}
