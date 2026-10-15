"use client";

import {
  defaultRangeExtractor,
  useWindowVirtualizer,
} from "@tanstack/react-virtual";
import { useCallback, useRef } from "react";
import type { TaskStatus } from "@/features/progress/status";
import { type RailTask, TaskRow } from "@/features/tasks/task-row";

interface RailListProps {
  rail: (RailTask & { meta: string })[];
  current: string;
  statuses?: Record<string, TaskStatus>;
  marks: Partial<Record<TaskStatus, string>>;
}

export function RailList({ rail, current, statuses, marks }: RailListProps) {
  const list = useRef<HTMLElement>(null);
  const active = Math.max(
    0,
    rail.findIndex((task) => task.id === current),
  );
  const keepActive = useCallback(
    (range: Parameters<typeof defaultRangeExtractor>[0]) => {
      const indexes = defaultRangeExtractor(range);
      return indexes.includes(active)
        ? indexes
        : [...indexes, active].sort((a, b) => a - b);
    },
    [active],
  );
  const virtualizer = useWindowVirtualizer({
    count: rail.length,
    estimateSize: () => 80,
    gap: 2,
    overscan: 8,
    initialRect: { width: 0, height: 1024 },
    scrollMargin: list.current?.offsetTop ?? 0,
    getItemKey: (index) => rail[index]?.id ?? index,
    rangeExtractor: keepActive,
  });
  const top = virtualizer.options.scrollMargin;

  return (
    <nav
      ref={list}
      className="relative"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((item) => {
        const task = rail[item.index];
        if (!task) return null;
        const status = statuses?.[task.id];
        const mark = marks[status ?? "new"];
        return (
          <div
            key={item.key}
            ref={virtualizer.measureElement}
            data-index={item.index}
            className="absolute inset-x-0 top-0"
            style={{ transform: `translateY(${item.start - top}px)` }}
          >
            <TaskRow
              task={task}
              active={task.id === current}
              meta={mark ? `${task.meta} · ${mark}` : task.meta}
              status={status}
            />
          </div>
        );
      })}
    </nav>
  );
}
