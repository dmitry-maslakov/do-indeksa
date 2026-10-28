export type GeneratedId = { kind: "custom"; taskIds: string[] };

export const composeSegment = "compose";

export function parseVariantId(id: string): GeneratedId | undefined {
  const set = /^set-([a-z0-9-]+(?:\.[a-z0-9-]+)*)$/.exec(id)?.[1];
  if (set) return { kind: "custom", taskIds: [...new Set(set.split("."))] };
}

export function customTaskIds(
  id: string,
  size: number,
  taskExists: (taskId: string) => unknown,
) {
  const parsed = parseVariantId(id);
  if (
    parsed &&
    parsed.taskIds.length <= size &&
    parsed.taskIds.every((taskId) => taskExists(taskId))
  )
    return parsed.taskIds;
}

export const setId = (taskIds: string[]) => `set-${taskIds.join(".")}`;
