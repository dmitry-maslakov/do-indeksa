"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  arrange,
  progressOf,
  shownUpcoming,
} from "@/features/bank/queue/arrange";
import type { Queue } from "@/features/bank/queue/queue";
import { recommendationOf } from "@/features/bank/queue/recommendation";
import { intentOf } from "@/lib/analytics-browser";
import { QueueLink } from "./queue-link";
import type { RowState } from "./queue-mark";
import { VisitHeader } from "./queue-progress";

interface QueueListProps {
  queue: Queue;
  current: string;
  topic: string;
  href: (id: string) => string;
}

function centerCurrent(list: HTMLElement, id: string) {
  const row = list.querySelector<HTMLElement>(`[data-id="${id}"]`);
  if (!row) return;
  const offset =
    row.getBoundingClientRect().top - list.getBoundingClientRect().top;
  list.scrollTop += offset - (list.clientHeight - row.offsetHeight) / 2;
}

const stateOf = (
  place: "visit" | "upcoming",
  rank: number,
  here: boolean,
): RowState => {
  if (place === "visit") return here ? "current" : "past";
  return rank === 1 ? "next" : "later";
};

export function QueueList({ queue, current, topic, href }: QueueListProps) {
  const lists = arrange(queue, current);
  const upcoming = lists.upcoming.slice(0, shownUpcoming);
  const progress = progressOf(lists, current);
  const [scrolled, setScrolled] = useState(false);
  const list = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (list.current) centerCurrent(list.current, current);
  }, [current]);

  const rows = [
    ...lists.visit.map((task, i) => ({
      task,
      place: "visit" as const,
      rank: i + 1,
    })),
    ...upcoming.map((task, i) => ({
      task,
      place: "upcoming" as const,
      rank: i + 1,
    })),
  ];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col border-t">
      <div
        ref={list}
        onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
        className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 [overflow-anchor:none]"
      >
        <VisitHeader
          done={progress?.done ?? 0}
          right={progress?.right ?? 0}
          scrolled={scrolled}
        />
        <div>
          {rows.map(({ task, place, rank }) => (
            <QueueLink
              key={task.id}
              task={task}
              href={href(task.id)}
              intent={intentOf({
                via: "picker",
                placement: `rail_${place}`,
                rank,
              })}
              state={stateOf(place, rank, task.id === current)}
              heading={
                place === "visit" &&
                rank === lists.visit.length &&
                upcoming.length > 0
              }
              page={current}
              recommendation={
                place === "upcoming"
                  ? recommendationOf("rail_upcoming", topic, task, rank)
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
