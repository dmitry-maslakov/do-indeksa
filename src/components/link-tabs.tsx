import { cva } from "class-variance-authority";
import { Link } from "@/i18n/navigation";

const list = cva("flex", {
  variants: {
    variant: {
      underline: "gap-5",
      segmented: "gap-1 rounded-xl bg-muted p-1",
      fill: "gap-1 rounded-xl bg-untouched p-1",
    },
  },
});

const tab = cva("font-medium transition-colors", {
  variants: {
    variant: {
      underline:
        "border-b-2 pb-1 text-sm data-[active=true]:border-primary data-[active=true]:font-semibold data-[active=false]:border-transparent data-[active=false]:text-subtle data-[active=false]:hover:text-foreground",
      segmented:
        "rounded-lg px-3 py-2 text-sm data-[active=true]:bg-card data-[active=true]:shadow-sm data-[active=false]:text-subtle data-[active=false]:hover:text-foreground",
      fill: "flex h-8 flex-1 items-center justify-center rounded-md text-sm data-[active=true]:bg-card data-[active=true]:shadow-raised data-[active=false]:text-muted-foreground data-[active=false]:hover:text-foreground",
    },
  },
});

interface LinkTabsProps {
  items: { href: string; label: string; active: boolean }[];
  variant: "underline" | "segmented" | "fill";
}

export function LinkTabs({ items, variant }: LinkTabsProps) {
  return (
    <nav className={list({ variant })}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
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
