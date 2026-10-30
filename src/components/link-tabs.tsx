import { cva } from "class-variance-authority";
import type { Ref } from "react";
import { Link } from "@/i18n/navigation";

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

interface LinkTabsProps {
  items: {
    href: string;
    label: string;
    active: boolean;
    prefetch?: boolean;
    intent?: string;
  }[];
  label: string;
  variant: "segmented" | "fill" | "pill";
  scroll?: boolean;
  ref?: Ref<HTMLElement>;
}

export function LinkTabs({
  items,
  label,
  variant,
  scroll = false,
  ref,
}: LinkTabsProps) {
  return (
    <nav ref={ref} aria-label={label} className={list({ variant })}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          prefetch={item.prefetch}
          data-intent={item.intent}
          scroll={scroll}
          data-active={item.active}
          aria-current={item.active ? "page" : undefined}
          className={tab({ variant })}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
