import { maxBy, sumBy } from "es-toolkit";
import { defaultPolicy, type LearningPolicy, type SignalName } from "../policy";
import type { Learning } from "../state";
import type { Decision, PlanContext, Rule, Signal } from "./contracts";

interface PlanOptions<C> {
  now: number;
  picked?: C[];
  rules?: Rule<C>[];
  policy?: LearningPolicy;
}

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
  { now, picked = [], rules = [], policy = defaultPolicy }: PlanOptions<C>,
): Decision<C, N>[] {
  if (size <= 0) return [];
  const context = { learning, picked, policy, now };
  const best = maxBy(
    candidates
      .filter((candidate) => rules.every((r) => r.allows(candidate, context)))
      .map((candidate) => ({
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
      { now, picked: [...picked, best.candidate], rules, policy },
    ),
  ];
}

export const signalled = <C, N extends SignalName>(
  candidates: C[],
  learning: Learning,
  signals: Signal<C, N>[],
  { now, policy = defaultPolicy }: Pick<PlanOptions<C>, "now" | "policy">,
) =>
  candidates.filter((candidate) =>
    contributions(
      candidate,
      { learning, picked: [], policy, now },
      signals,
    ).some((p) => p.value > 0),
  );
