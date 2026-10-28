import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

export function useFeed<Page extends { next: number | null }>(
  path: string,
  first: Page,
  search = "",
) {
  const locale = useLocale();
  return useInfiniteQuery({
    queryKey: [path, locale, search],
    queryFn: async ({ pageParam, signal }): Promise<Page> => {
      const params = new URLSearchParams(search);
      params.set("offset", String(pageParam));
      params.set("locale", locale);
      const response = await fetch(`${path}?${params}`, { signal });
      if (!response.ok) throw new Error(`${path} failed: ${response.status}`);
      return response.json();
    },
    initialPageParam: 0,
    initialData: { pages: [first], pageParams: [0] },
    getNextPageParam: (last) => last.next,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });
}
