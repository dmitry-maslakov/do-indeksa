import { belgradeDate } from "@/lib/dates";

export const nudgeAfterSolved = 5;

export const isReturningGuest = (solvedAt: Date[], today = belgradeDate()) =>
  solvedAt.length >= nudgeAfterSolved &&
  solvedAt.some((at) => belgradeDate(at) < today);
