import type { Segment } from "@/lib/strip";

export const results = ["ok", "part", "no"] as const;
export type Result = (typeof results)[number];

export const resultOf = (segment: Segment): Result =>
  segment === "done" ? "ok" : segment === "partial" ? "part" : "no";

export const resultTone: Record<Result, string> = {
  ok: "bg-success-tint text-success-text",
  part: "bg-overtime-tint text-overtime-text",
  no: "bg-error-tint text-error-text",
};
