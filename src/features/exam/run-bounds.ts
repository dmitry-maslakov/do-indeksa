import { dayMs } from "@/lib/dates";

export function withinDay(startedAt: number) {
  const now = Date.now();
  return startedAt <= now && startedAt >= now - dayMs;
}
