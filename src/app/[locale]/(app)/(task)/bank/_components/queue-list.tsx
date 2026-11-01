"use client";

import { useEffect, useState } from "react";
import {
  arrange,
  progressOf,
  shownUpcoming,
} from "@/features/bank/queue/arrange";
import type { Queue } from "@/features/bank/queue/queue";
import { recommendationOf } from "@/features/bank/queue/recommendation";
import { intentOf } from "@/lib/analytics-browser";
import { JumpPill } from "./jump-pill";
import { QueueLink } from "./queue-link";
import type { RowState } from "./queue-mark";
import { VisitHeader } from "./queue-progress";
import { useQueueScroll } from "./use-queue-scroll";

interface QueueListProps {
  queue: Queue;
  current: string;
  topic: string;
  href: (id: string) => string;
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
  const [live, setLive] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { list, events, back } = useQueueScroll(current, upcoming[0]?.id);

  useEffect(() => setLive(true), []);

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

  const hereIndex = rows.findIndex(({ task }) => task.id === current);

  return (
    <div
      data-live={live || undefined}
      className="group/list relative flex min-h-0 flex-1 flex-col border-t"
    >
      <div
        ref={list}
        {...events}
        onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
        className="min-h-0 flex-1 scroll-pt-10 overflow-y-auto px-2 pb-3 [overflow-anchor:none]"
      >
        <VisitHeader
          done={progress?.done ?? 0}
          right={progress?.right ?? 0}
          scrolled={scrolled}
        />
        <div>
          {rows.map(({ task, place, rank }, index) => (
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
              ahead={index > hereIndex}
              entering={live}
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
      <JumpPill list={list} current={current} onJump={back} />
    </div>
  );
}
