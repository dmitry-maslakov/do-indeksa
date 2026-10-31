import { maxBy, sumBy } from "es-toolkit";
import { defaultPolicy, type LearningPolicy, type SignalName } from "../policy";
import type { Learning } from "../state";
import type { Decision, PlanContext, Signal } from "./contracts";

const contributions = <C, N extends SignalName>(
  candidate: C,
  context: PlanContext<C>,
  signals: Signal<C, N>[],
) =>
  signals.map(({ name, score }) => ({
    name,
    value: context.policy.signalWeights[name] * score(candidate, context),
  }));

export function plan<C, N extends SignalName>(
  candidates: C[],
  learning: Learning,
  signals: Signal<C, N>[],
  size: number,
  picked: C[] = [],
  policy: LearningPolicy = defaultPolicy,
): Decision<C, N>[] {
  if (size <= 0) return [];
  const context = { learning, picked, policy };
  const best = maxBy(
    candidates.map((candidate) => ({
      candidate,
      parts: contributions(candidate, context, signals),
    })),
    ({ parts }) => sumBy(parts, (p) => p.value),
  );
  const strongest = best && maxBy(best.parts, (p) => p.value);
  if (!best || !strongest) return [];
  return [
    { candidate: best.candidate, reason: strongest.name },
    ...plan(
      candidates.filter((c) => c !== best.candidate),
      learning,
      signals,
      size - 1,
      [...picked, best.candidate],
      policy,
    ),
  ];
}

export const signalled = <C, N extends SignalName>(
  candidates: C[],
  learning: Learning,
  signals: Signal<C, N>[],
  policy: LearningPolicy = defaultPolicy,
) =>
  candidates.filter((candidate) =>
    contributions(candidate, { learning, picked: [], policy }, signals).some(
      (p) => p.value > 0,
    ),
  );
