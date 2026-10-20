import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { TestPage } from "./test-feed";

async function fetchPage(
  offset: number,
  locale: string,
  signal: AbortSignal,
): Promise<TestPage> {
  const params = new URLSearchParams({ offset: String(offset), locale });
  const response = await fetch(`/api/tests?${params}`, { signal });
  if (!response.ok) throw new Error(`test feed failed: ${response.status}`);
  return response.json();
}

export function useTestFeed(first: TestPage) {
  const locale = useLocale();
  return useInfiniteQuery({
    queryKey: ["tests", locale],
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, locale, signal),
    initialPageParam: 0,
    initialData: { pages: [first], pageParams: [0] },
    getNextPageParam: (last) => last.next,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });
}
