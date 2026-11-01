import { skipToken, useQuery } from "@tanstack/react-query";
import type { Earlier } from "@/features/bank/queue/queue";
import { minuteMs } from "@/lib/dates";

const path = "/api/bank/earlier";

const staleMs = 5 * minuteMs;

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

export const useEarlier = (topic: string, earlier: boolean) =>
  useQuery({
    queryKey: [path, topic],
    queryFn: earlier ? ({ signal }) => fetchEarlier(topic, signal) : skipToken,
    staleTime: staleMs,
  });
