"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ListRow } from "@/features/bank/rail-page";
import { useRailRows } from "@/features/bank/use-rail-rows";
import { useErrorText } from "@/lib/use-error-text";
import { ListLink, rowHeight } from "./rail-row";

interface AllListProps {
  search: string;
  current: string;
  href: (id: string) => string;
}

const reach = 10;

function Placeholder() {
  return (
    <div className="flex h-10 items-center px-2">
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

function Failed({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("Errors");
  const errorText = useErrorText();
  return (
    <div className="flex flex-wrap items-center gap-3 p-2 text-sm">
      <span role="alert" className="text-error-text">
        {errorText()}
      </span>
      <Button size="sm" variant="ghost" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}

export function AllList({ search, current, href }: AllListProps) {
  const [anchor] = useState(current);
  const query = useRailRows(search, anchor);
  const list = useRef<HTMLDivElement>(null);
  const pages = query.data?.pages ?? [];
  const total = pages[0]?.total ?? 0;
  const rows = new Map<number, ListRow>(
    pages.flatMap((page) =>
      page.rows.map((row, i): [number, ListRow] => [page.start + i, row]),
    ),
  );
  const first = pages[0]?.start ?? 0;
  const last = pages.reduce(
    (end, p) => Math.max(end, p.start + p.rows.length),
    0,
  );
  const virtualizer = useVirtualizer({
    count: total,
    estimateSize: () => rowHeight,
    overscan: 12,
    getScrollElement: () => list.current,
  });
  const items = virtualizer.getVirtualItems();
  const from = items[0]?.index ?? 0;
  const to = items.at(-1)?.index ?? 0;
  const anchorAt = [...rows].find(([, row]) => row.id === anchor)?.[0] ?? -1;
  const centered = useRef(false);
  const {
    hasNextPage,
    hasPreviousPage,
    isFetching,
    fetchNextPage,
    fetchPreviousPage,
  } = query;

  useLayoutEffect(() => {
    if (centered.current || anchorAt < 0) return;
    centered.current = true;
    virtualizer.scrollToIndex(anchorAt, { align: "center" });
  }, [anchorAt, virtualizer]);

  useEffect(() => {
    if (isFetching || !total) return;
    if (hasNextPage && to >= last - reach) fetchNextPage();
    else if (hasPreviousPage && from <= first + reach) fetchPreviousPage();
  }, [
    isFetching,
    total,
    hasNextPage,
    hasPreviousPage,
    from,
    to,
    first,
    last,
    fetchNextPage,
    fetchPreviousPage,
  ]);

  return (
    <div
      ref={list}
      className="min-h-0 flex-1 overflow-y-auto border-t px-2 pb-3"
    >
      {query.isError && !pages.length && (
        <Failed onRetry={() => query.refetch()} />
      )}
      {query.isPending && <Placeholder />}
      <nav className="relative" style={{ height: virtualizer.getTotalSize() }}>
        {items.map((item) => {
          const task = rows.get(item.index);
          return (
            <div
              key={item.key}
              className="absolute inset-x-0 top-0"
              style={{ transform: `translateY(${item.start}px)` }}
            >
              {task ? (
                <ListLink
                  task={task}
                  href={href(task.id)}
                  current={task.id === current}
                  number={item.index + 1}
                />
              ) : (
                <Placeholder />
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
