"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { queueEvent } from "@/lib/analytics-browser";
import { watchReading } from "@/lib/reading";

interface SolutionsReadingProps {
  variantId: string;
  className: string;
  children: ReactNode;
}

export function SolutionsReading({
  variantId,
  className,
  children,
}: SolutionsReadingProps) {
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (list.current)
      return watchReading(list.current, ":scope > li", (read, path) =>
        queueEvent("solutions_read", { ...read, variant_id: variantId }, path),
      );
  }, [variantId]);

  return (
    <ol ref={list} className={className}>
      {children}
    </ol>
  );
}
