"use client";

import { cva } from "class-variance-authority";
import type { MouseEvent, Ref } from "react";
import { Link } from "@/i18n/navigation";
import { type BrowserEvents, queueEvent } from "@/lib/analytics-browser";

const list = cva("flex", {
  variants: {
    variant: {
      segmented: "gap-1 rounded-xl bg-muted p-1",
      fill: "gap-1 rounded-xl bg-untouched p-1",
      pill: "-mx-4 gap-2 overflow-x-auto px-4 scrollbar-none md:mx-0 md:flex-wrap md:px-0",
    },
  },
});

const tab = cva("font-medium transition-colors", {
  variants: {
    variant: {
      segmented:
        "rounded-lg px-3 py-2 text-sm data-[active=true]:bg-card data-[active=true]:shadow-sm data-[active=false]:text-subtle data-[active=false]:hover:text-foreground",
      fill: "flex h-8 flex-1 items-center justify-center rounded-md text-sm data-[active=true]:bg-card data-[active=true]:shadow-raised data-[active=false]:text-muted-foreground data-[active=false]:hover:text-foreground",
      pill: "flex h-9 shrink-0 items-center rounded-full bg-muted px-4 text-muted-foreground text-sm data-[active=true]:bg-data-tint data-[active=true]:font-bold data-[active=true]:text-data",
    },
  },
});

const isModified = (event: MouseEvent) =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

interface LinkTabsProps {
  items: {
    href: string;
    label: string;
    active: boolean;
    intent?: string;
    value?: string;
  }[];
  label: string;
  variant: "segmented" | "fill" | "pill";
  scroll?: boolean;
  shallow?: boolean;
  control?: BrowserEvents["control_used"]["control"];
  ref?: Ref<HTMLElement>;
}

export function LinkTabs({
  items,
  label,
  variant,
  scroll = false,
  shallow = false,
  control,
  ref,
}: LinkTabsProps) {
  return (
    <nav ref={ref} aria-label={label} className={list({ variant })}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          data-intent={item.intent}
          scroll={scroll}
          data-active={item.active}
          aria-current={item.active ? "page" : undefined}
          className={tab({ variant })}
          onClick={(event) => {
            if (control)
              queueEvent("control_used", { control, value: item.value });
            if (!shallow || isModified(event)) return;
            event.preventDefault();
            if (!item.active)
              history.pushState(null, "", event.currentTarget.href);
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
