import { cn } from "cn";
import { segmentTone } from "@/components/segment-tone";
import type { Segment } from "@/lib/strip";

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
          <span
            key={position}
            className={cn("flex-1 rounded-[2px]", segmentTone[state].strip)}
          />
        ))}
    </div>
  );
}
