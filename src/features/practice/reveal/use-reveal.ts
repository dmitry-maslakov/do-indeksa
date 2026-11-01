import { skipToken, useQuery } from "@tanstack/react-query";
import type { Reveal, RevealPart } from "./reveals";

async function fetchPart(
  taskId: string,
  part: RevealPart,
  signal: AbortSignal,
): Promise<Reveal> {
  const params = new URLSearchParams({ part: String(part) });
  const response = await fetch(`/api/tasks/${taskId}/reveal?${params}`, {
    signal,
  });
  if (!response.ok)
    throw new Error(`reveal failed: ${response.status}`, {
      cause: response.status,
    });
  return response.json();
}

export const useReveal = (taskId: string, part?: RevealPart) =>
  useQuery({
    queryKey: ["reveal", taskId, part],
    queryFn:
      part === undefined
        ? skipToken
        : ({ signal }) => fetchPart(taskId, part, signal),
    staleTime: Number.POSITIVE_INFINITY,
  });
