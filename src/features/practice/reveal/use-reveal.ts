import { useQuery } from "@tanstack/react-query";
import type { RevealPart } from "./reveals";

async function fetchPart(
  taskId: string,
  part: RevealPart,
  signal: AbortSignal,
) {
  const params = new URLSearchParams({ part: String(part) });
  const response = await fetch(`/api/tasks/${taskId}/reveal?${params}`, {
    signal,
  });
  if (!response.ok)
    throw new Error(`reveal failed: ${response.status}`, {
      cause: response.status,
    });
  const { html }: { html: string } = await response.json();
  return html;
}

export const useReveal = (taskId: string, part: RevealPart) =>
  useQuery({
    queryKey: ["reveal", taskId, part],
    queryFn: ({ signal }) => fetchPart(taskId, part, signal),
    staleTime: Number.POSITIVE_INFINITY,
  });
