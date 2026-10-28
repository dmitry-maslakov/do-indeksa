export type GeneratedId = { kind: "custom"; taskIds: string[] };

export function parseVariantId(id: string): GeneratedId | undefined {
  const set = /^set-([a-z0-9-]+(?:\.[a-z0-9-]+){0,9})$/.exec(id)?.[1];
  if (set) return { kind: "custom", taskIds: [...new Set(set.split("."))] };
}

export const setId = (taskIds: string[]) => `set-${taskIds.join(".")}`;
