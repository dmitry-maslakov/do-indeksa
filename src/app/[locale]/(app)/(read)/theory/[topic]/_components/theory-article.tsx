"use client";

import { clamp } from "es-toolkit";
import { type ReactNode, useEffect, useRef } from "react";
import { type BrowserEvents, flush, queueEvent } from "@/lib/analytics-browser";

type Read = BrowserEvents["theory_read"];
type Reading = Pick<Read, "topic" | "method" | "page">;

interface TheoryArticleProps extends Reading {
  className: string;
  children: ReactNode;
}

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
  let since = visibleNow();

  const measure = () => {
    const { top, height } = node.getBoundingClientRect();
    depth = Math.max(depth, clamp((innerHeight - top) / height, 0, 1));
    reached = Math.max(
      reached,
      headings.filter((h) => h.getBoundingClientRect().top < innerHeight)
        .length,
    );
  };
  const send = (exit: Read["exit"]) => {
    if (since !== undefined) visibleMs += performance.now() - since;
    since = undefined;
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
        exit,
        seq: ++seq,
      },
      path,
    );
  };
  const onVisibility = () => {
    if (document.visibilityState === "hidden") send("hidden");
    else since = visibleNow();
  };
  const onPageHide = () => {
    send("pagehide");
    flush();
  };

  measure();
  addEventListener("scroll", measure, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  addEventListener("pagehide", onPageHide);
  return () => {
    removeEventListener("scroll", measure);
    document.removeEventListener("visibilitychange", onVisibility);
    removeEventListener("pagehide", onPageHide);
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
