"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const style = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--border)",
  "--error-bg": "var(--error-tint)",
  "--error-text": "var(--error-text)",
  "--error-border": "var(--error-tint)",
  "--border-radius": "var(--radius-xl)",
} as CSSProperties;

export function Toaster(props: ToasterProps) {
  return <Sonner richColors style={style} {...props} />;
}
