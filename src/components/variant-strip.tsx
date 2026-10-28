import { cva } from "class-variance-authority";
import type { Segment } from "@/lib/strip";

const segment = cva("flex-1 rounded-[2px]", {
  variants: {
    state: {
      none: "bg-untouched",
      done: "bg-data",
      error: "border-2 border-error bg-error-tint",
      partial:
        "bg-[linear-gradient(90deg,var(--data)_50%,var(--untouched)_50%)]",
    },
  },
});

interface VariantStripProps {
  segments: Segment[];
  label: string;
}

export function VariantStrip({ segments, label }: VariantStripProps) {
  return (
    <div role="img" aria-label={label} className="flex h-2 gap-[3px]">
      {segments
        .map((state, i) => ({ state, position: i + 1 }))
        .map(({ state, position }) => (
          <span key={position} className={segment({ state })} />
        ))}
    </div>
  );
}
