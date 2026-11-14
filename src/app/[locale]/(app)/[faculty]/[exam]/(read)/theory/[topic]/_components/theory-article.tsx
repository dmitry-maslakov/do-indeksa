"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { type BrowserEvents, queueEvent } from "@/lib/analytics-browser";
import { watchReading } from "@/lib/reading";

type Reading = Pick<BrowserEvents["theory_read"], "topic" | "method" | "page">;

interface TheoryArticleProps extends Reading {
  className: string;
  children: ReactNode;
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
      return watchReading(article.current, "h2[id]", (read, path) =>
        queueEvent("theory_read", { ...read, topic, method, page }, path),
      );
  }, [topic, method, page]);

  return (
    <article ref={article} className={className}>
      {children}
    </article>
  );
}
