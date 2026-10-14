import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { FeedPage } from "./feed";

async function fetchPage(
  search: string,
  offset: number,
  locale: string,
  signal: AbortSignal,
): Promise<FeedPage> {
  const params = new URLSearchParams(search);
  params.set("offset", String(offset));
  params.set("locale", locale);
  const response = await fetch(`/api/bank?${params}`, { signal });
  if (!response.ok) throw new Error(`bank feed failed: ${response.status}`);
  return response.json();
}

export function useBankFeed(search: string, first: FeedPage) {
  const locale = useLocale();
  return useInfiniteQuery({
    queryKey: ["bank", locale, search],
    queryFn: ({ pageParam, signal }) =>
      fetchPage(search, pageParam, locale, signal),
    initialPageParam: 0,
    initialData: { pages: [first], pageParams: [0] },
    getNextPageParam: (last) => last.next,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });
}
