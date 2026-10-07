import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type { Segment } from "@/lib/strip";

const strip = cva("flex", {
  variants: {
    size: {
      sm: "h-1.5 gap-[3px]",
      md: "h-2 gap-[3px]",
      lg: "h-3.5 gap-1",
    },
  },
  defaultVariants: { size: "md" },
});

const segment = cva("flex-1 rounded-[2px]", {
  variants: {
    state: {
      none: "bg-untouched",
      done: "bg-data",
      error: "border-2 border-error bg-error-tint",
      partial:
        "bg-[linear-gradient(90deg,var(--data)_50%,var(--untouched)_50%)]",
      current:
        "bg-primary ring-2 ring-card ring-offset-0 outline outline-1 outline-primary",
    },
  },
});

interface VariantStripProps extends VariantProps<typeof strip> {
  segments: Segment[];
  label: string;
  className?: string;
}

export function VariantStrip({
  segments,
  label,
  size,
  className,
}: VariantStripProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(strip({ size }), className)}
    >
      {segments
        .map((state, i) => ({ state, position: i + 1 }))
        .map(({ state, position }) => (
          <span key={position} className={segment({ state })} />
        ))}
    </div>
  );
}
