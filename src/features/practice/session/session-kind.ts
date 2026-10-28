import type { SessionKind } from "@/db/columns";
import { hourMs, secondMs } from "@/lib/dates";

export const attemptGapMs = hourMs;

export const keepAliveMs = 30 * secondMs;

export const sessionLiveMs = 45 * secondMs;

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
