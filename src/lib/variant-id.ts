export type GeneratedId =
  | { kind: "daily" }
  | { kind: "random" }
  | { kind: "custom"; taskIds: string[] };

const isDate = (day: string) => {
  const at = Date.parse(day);
  return !Number.isNaN(at) && new Date(at).toISOString().startsWith(day);
};

export function parseVariantId(id: string): GeneratedId | undefined {
  const day = /^daily-(\d{4}-\d{2}-\d{2})$/.exec(id)?.[1];
  if (day && isDate(day)) return { kind: "daily" };
  if (/^random-[0-9a-f]{8}$/.test(id)) return { kind: "random" };
  const set = /^set-([a-z0-9-]+(?:\.[a-z0-9-]+){0,9})$/.exec(id)?.[1];
  if (set) return { kind: "custom", taskIds: [...new Set(set.split("."))] };
}

export const setId = (taskIds: string[]) => `set-${taskIds.join(".")}`;
