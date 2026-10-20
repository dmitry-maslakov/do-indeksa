import { pick } from "./pick";

export const composeModes = ["exam", "weak", "unsolved", "topics"] as const;
export type ComposeMode = (typeof composeModes)[number];

interface Pool {
  byPosition: string[][];
  byTopic: Map<string, string[]>;
}

interface ComposeInput {
  mode: ComposeMode;
  topics: string[];
  weak: string[];
  solved: Set<string>;
  size?: number;
}

export function compose(pool: Pool, input: ComposeInput, seed: string) {
  const size = input.size ?? pool.byPosition.length;
  const exam = () => pick(pool.byPosition, size, seed);
  const fromTopics = (topics: string[]) =>
    pick(
      topics.flatMap((t) => pool.byTopic.get(t) ?? []).map((id) => [id]),
      size,
      seed,
    );
  const picked = {
    exam,
    weak: () => fromTopics(input.weak),
    topics: () => fromTopics(input.topics),
    unsolved: () =>
      pick(
        pool.byPosition.map((ids) => ids.filter((id) => !input.solved.has(id))),
        size,
        seed,
      ),
  }[input.mode]();
  return picked.length > 0
    ? { ids: picked, fallback: false }
    : { ids: exam(), fallback: true };
}

export function swap(same: string[], ids: string[], index: number) {
  const at = same.indexOf(ids[index] ?? "");
  const next = [...same.slice(at + 1), ...same.slice(0, at)].find(
    (id) => !ids.includes(id),
  );
  return next && ids.with(index, next);
}
