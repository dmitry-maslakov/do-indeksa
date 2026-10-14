import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { RunPage } from "./run-feed";

async function fetchPage(
  offset: number,
  locale: string,
  signal: AbortSignal,
): Promise<RunPage> {
  const params = new URLSearchParams({ offset: String(offset), locale });
  const response = await fetch(`/api/runs?${params}`, { signal });
  if (!response.ok) throw new Error(`run feed failed: ${response.status}`);
  return response.json();
}

export function useRunFeed(first: RunPage) {
  const locale = useLocale();
  return useInfiniteQuery({
    queryKey: ["runs", locale],
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, locale, signal),
    initialPageParam: 0,
    initialData: { pages: [first], pageParams: [0] },
    getNextPageParam: (last) => last.next,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });
}
