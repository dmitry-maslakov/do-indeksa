import type { Segment } from "@/lib/strip";

const wrongChip = "bg-error-tint text-error-text";

interface SegmentTone {
  chip: string;
  bar: string;
  text: string;
  strip: string;
}

export const segmentTone: Record<Segment, SegmentTone> = {
  done: {
    chip: "bg-success-tint text-success-text",
    bar: "bg-success",
    text: "text-success-text",
    strip: "bg-data",
  },
  partial: {
    chip: "bg-overtime-tint text-overtime-text",
    bar: "bg-overtime",
    text: "text-overtime-text",
    strip: "bg-[linear-gradient(90deg,var(--data)_50%,var(--untouched)_50%)]",
  },
  error: {
    chip: wrongChip,
    bar: "bg-error",
    text: "text-error-text",
    strip: "border-2 border-error bg-error-tint",
  },
  none: {
    chip: wrongChip,
    bar: "bg-untouched",
    text: "text-subtle",
    strip: "bg-untouched",
  },
};
