export type Segment = "none" | "done" | "error" | "partial" | "current";

export function segmentOf(parts: boolean[] | undefined): Segment {
  if (!parts || parts.length === 0) return "none";
  const right = parts.filter(Boolean).length;
  if (right === parts.length) return "done";
  return right === 0 ? "error" : "partial";
}
