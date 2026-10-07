export type GeneratedId =
  | { kind: "daily" }
  | { kind: "random" }
  | { kind: "custom"; taskIds: string[] };

export function parseVariantId(id: string): GeneratedId | undefined {
  if (/^daily-\d{4}-\d{2}-\d{2}$/.test(id)) return { kind: "daily" };
  if (/^random-[0-9a-f]{8}$/.test(id)) return { kind: "random" };
  const set = /^set-([a-z0-9-]+(?:\.[a-z0-9-]+){0,9})$/.exec(id)?.[1];
  if (set) return { kind: "custom", taskIds: [...new Set(set.split("."))] };
}

export const setId = (taskIds: string[]) => `set-${taskIds.join(".")}`;
