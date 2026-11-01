"use client";

import { cn } from "cn";
import { Fragment, useEffect, useRef, useState } from "react";
import { observe } from "react-intersection-observer";
import { arrange, shownUpcoming } from "@/features/bank/queue/arrange";
import type { Queue } from "@/features/bank/queue/queue";
import { recommendationOf } from "@/features/bank/queue/recommendation";
import { intentOf } from "@/lib/analytics-browser";
import { EarlierHeading } from "./earlier";
import { JumpPill } from "./jump-pill";
import { QueueLink } from "./queue-link";
import type { RowState } from "./queue-mark";
import { useEarlier } from "./use-earlier";
import { useKeptPlace } from "./use-kept-place";
import { useQueueScroll } from "./use-queue-scroll";

interface QueueListProps {
  queue: Queue;
  current: string;
  topic: string;
  href: (id: string) => string;
}

// Earlier groups shown above the session at first, and added per scroll to the top.
const groupsPerLoad = 4;

interface EarlierView {
  task: string;
  depth: number;
  opened: ReadonlySet<string>;
}

// Stands in for the list's top padding, so the earlier groups go fully out of
// view above it and only the timeline line hints at them.
const sessionTop =
  "relative h-2 before:absolute before:inset-y-0 before:left-[15.25px] before:w-[1.5px] before:bg-input";

const freshView = (task: string): EarlierView => ({
  task,
  depth: groupsPerLoad,
  opened: new Set(),
});

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
  const [live, setLive] = useState(false);
  const { list, events, back } = useQueueScroll(current);
  const { here, keepAt } = useKeptPlace(list);
  const earlier = useEarlier(topic, queue.earlier);
  const [view, setView] = useState(() => freshView(current));
  const top = useRef<HTMLDivElement>(null);

  // Going to a task folds the history back: far groups unload, near ones close.
  if (view.task !== current) setView(freshView(current));

  const all = live ? (earlier.data?.groups ?? []) : [];
  const groups = all.slice(-view.depth);
  const more = groups.length < all.length;

  useEffect(() => setLive(true), []);

  useEffect(() => {
    const root = list.current;
    const edge = top.current;
    if (!root || !edge || !more) return;
    return observe(
      edge,
      (inView) =>
        inView && setView((v) => ({ ...v, depth: v.depth + groupsPerLoad })),
      { root },
    );
  }, [list, more]);

  const toggleGroup = (key: string, heading: HTMLElement) => {
    keepAt(heading);
    const opened = new Set(view.opened);
    if (opened.has(key)) opened.delete(key);
    else opened.add(key);
    setView({ ...view, opened });
  };

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
        className={cn(
          "min-h-0 flex-1 overflow-y-auto px-2 pb-3 [overflow-anchor:none]",
          queue.earlier === 0 && "pt-2",
        )}
      >
        <div>
          {more && <div ref={top} aria-hidden className="h-px" />}
          {earlier.data &&
            groups.map((group) => (
              <Fragment key={group.key}>
                <EarlierHeading
                  period={group.period}
                  tz={earlier.data.tz}
                  now={earlier.dataUpdatedAt}
                  count={group.rows.length}
                  open={view.opened.has(group.key)}
                  onToggle={(heading) => toggleGroup(group.key, heading)}
                />
                {(view.opened.has(group.key) ? group.rows : []).map(
                  (task, i) => (
                    <QueueLink
                      key={task.id}
                      task={task}
                      href={href(task.id)}
                      intent={intentOf({
                        via: "picker",
                        placement: "rail_earlier",
                        rank: i + 1,
                      })}
                      state="past"
                      ahead={false}
                      entering={false}
                      page={current}
                      earlier
                    />
                  ),
                )}
              </Fragment>
            ))}
          {queue.earlier > 0 && <div ref={here} className={sessionTop} />}
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
      <JumpPill
        list={list}
        current={current}
        onJump={() => {
          setView(freshView(current));
          back();
        }}
      />
    </div>
  );
}
