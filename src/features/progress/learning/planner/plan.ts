import { maxBy, sumBy } from "es-toolkit";
import { defaultPolicy, type LearningPolicy } from "../policy";
import type { Learning } from "../state";
import type { Candidate, Decision, PlanContext, Signal } from "./contracts";

const contributions = (
  candidate: Candidate,
  context: PlanContext,
  signals: Signal[],
) =>
  signals.map(({ name, score }) => ({
    name,
    value: context.policy.signalWeights[name] * score(candidate, context),
  }));

export function plan(
  candidates: Candidate[],
  learning: Learning,
  signals: Signal[],
  size: number,
  picked: Candidate[] = [],
  policy: LearningPolicy = defaultPolicy,
): Decision[] {
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
