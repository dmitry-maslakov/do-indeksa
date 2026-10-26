import { hourMs } from "@/lib/dates";

export const sessionKinds = ["first", "retry", "mock"] as const;

export type SessionKind = (typeof sessionKinds)[number];

export const attemptGapMs = hourMs;

export interface LastEvent {
  kind: SessionKind;
  recent: boolean;
}

export function practiceKind(
  last: LastEvent | undefined,
  worked: boolean,
): Exclude<SessionKind, "mock"> {
  if (last?.recent && last.kind !== "mock") return last.kind;
  return worked ? "retry" : "first";
}
