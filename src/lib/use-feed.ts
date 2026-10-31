import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { type BrowserEvents, queueEvent } from "./analytics-browser";

export interface Page<T> {
  items: T[];
  next: number | null;
}

type List = BrowserEvents["list_page_loaded"]["list"];

export function useFeed<T>(
  list: List,
  first: Page<T>,
  search = "",
  keep = false,
) {
  const locale = useLocale();
  const path = `/api/${list}`;
  return useInfiniteQuery({
    queryKey: [path, locale, search],
    queryFn: async ({ pageParam, signal }): Promise<Page<T>> => {
      const params = new URLSearchParams(search);
      params.set("offset", String(pageParam));
      params.set("locale", locale);
      const response = await fetch(`${path}?${params}`, { signal });
      if (!response.ok)
        throw new Error(`${path} failed: ${response.status}`, {
          cause: response.status,
        });
      const page: Page<T> = await response.json();
      queueEvent("list_page_loaded", {
        list,
        offset: pageParam,
        items: page.items.length,
      });
      return page;
    },
    initialPageParam: 0,
    initialData: { pages: [first], pageParams: [0] },
    getNextPageParam: (last) => last.next,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: keep ? undefined : 0,
  });
}
