"use client";

import { useEffect } from "react";

export function FocusMode({ mode }: { mode: "task" | "exam" | "read" }) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.focus = mode;
    return () => {
      delete root.dataset.focus;
    };
  }, [mode]);
  return null;
}
