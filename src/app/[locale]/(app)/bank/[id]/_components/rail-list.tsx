"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
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
  const virtualizer = useWindowVirtualizer({
    count: rail.length,
    estimateSize: () => 80,
    gap: 2,
    overscan: 8,
    scrollMargin: list.current?.offsetTop ?? 0,
    getItemKey: (index) => rail[index]?.id ?? index,
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
