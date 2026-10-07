import { pick } from "./pick";

export const composeModes = ["exam", "weak", "unsolved", "topics"] as const;

interface Pool {
  byPosition: string[][];
  tasks: { id: string; topic: string }[];
}

interface ComposeInput {
  mode: (typeof composeModes)[number];
  topics: string[];
  weak: string[];
  solved: Set<string>;
}

export function compose(pool: Pool, input: ComposeInput, seed: string) {
  const size = pool.byPosition.length;
  const fromTopics = (topics: string[]) =>
    pick(
      pool.tasks.filter((t) => topics.includes(t.topic)).map((t) => [t.id]),
      size,
      seed,
    );
  const picked = {
    exam: () => [],
    weak: () => fromTopics(input.weak),
    topics: () => fromTopics(input.topics),
    unsolved: () =>
      pick(
        pool.byPosition.map((ids) => ids.filter((id) => !input.solved.has(id))),
        size,
        seed,
      ),
  }[input.mode]();
  return picked.length > 0 ? picked : pick(pool.byPosition, size, seed);
}
