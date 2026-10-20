import { useInfiniteQuery } from "@tanstack/react-query";
import { type ListPage, railPage } from "./rail-page";

async function fetchPage(
  search: string,
  offset: number | null,
  around: string,
  signal: AbortSignal,
): Promise<ListPage> {
  const params = new URLSearchParams(search);
  if (offset === null) params.set("around", around);
  else params.set("offset", String(offset));
  const response = await fetch(`/api/bank/rail?${params}`, { signal });
  if (!response.ok) throw new Error(`rail failed: ${response.status}`);
  return response.json();
}

export const useRailRows = (search: string, around: string) =>
  useInfiniteQuery({
    queryKey: ["rail", search],
    queryFn: ({ pageParam, signal }) =>
      fetchPage(search, pageParam, around, signal),
    initialPageParam: null as number | null,
    getNextPageParam: (last) => {
      const end = last.start + last.rows.length;
      return end < last.total ? end : undefined;
    },
    getPreviousPageParam: (first) =>
      first.start > 0 ? Math.max(0, first.start - railPage) : undefined,
  });
