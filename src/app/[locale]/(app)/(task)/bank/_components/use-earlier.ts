import { skipToken, useQuery } from "@tanstack/react-query";
import type { Earlier } from "@/features/bank/queue/queue";

const path = "/api/bank/earlier";

const staleMs = 5 * 60 * 1000;

async function fetchEarlier(
  topic: string,
  signal: AbortSignal,
): Promise<Earlier> {
  const params = new URLSearchParams({ topic });
  const response = await fetch(`${path}?${params}`, { signal });
  if (!response.ok)
    throw new Error(`${path} failed: ${response.status}`, {
      cause: response.status,
    });
  return response.json();
}

export const useEarlier = (topic: string, count: number) =>
  useQuery({
    queryKey: [path, topic, count],
    queryFn:
      count > 0 ? ({ signal }) => fetchEarlier(topic, signal) : skipToken,
    staleTime: staleMs,
  });
