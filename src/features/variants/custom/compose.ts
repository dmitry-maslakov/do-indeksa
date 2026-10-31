import { pick } from "@/features/variants/pick";

export const composeModes = ["exam", "topics"] as const;
export type ComposeMode = (typeof composeModes)[number];

interface Pool {
  byPosition: string[][];
  byTopic: Map<string, string[]>;
}

interface ComposeInput {
  mode: ComposeMode;
  topics: string[];
  size?: number;
}

export function compose(pool: Pool, input: ComposeInput, seed: string) {
  const size = input.size ?? pool.byPosition.length;
  const exam = () => pick(pool.byPosition, size, seed);
  const picked =
    input.mode === "topics"
      ? pick(
          input.topics
            .flatMap((t) => pool.byTopic.get(t) ?? [])
            .map((id) => [id]),
          size,
          seed,
        )
      : exam();
  return picked.length > 0
    ? { ids: picked, fallback: false }
    : { ids: exam(), fallback: true };
}

export function swap(same: string[], ids: string[], index: number) {
  const at = same.indexOf(ids[index] ?? "");
  const next = [...same.slice(at + 1), ...same.slice(0, at)].find(
    (id) => !ids.includes(id),
  );
  return next === undefined ? undefined : ids.with(index, next);
}
