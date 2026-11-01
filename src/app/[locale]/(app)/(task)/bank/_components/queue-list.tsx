"use client";

import { useTranslations } from "next-intl";
import { Fragment, useLayoutEffect, useRef } from "react";
import { RailHeading } from "@/components/rail";
import { arrange } from "@/features/bank/queue/arrange";
import type { Queue } from "@/features/bank/queue/queue";
import { recommendationOf } from "@/features/bank/queue/recommendation";
import { intentOf } from "@/lib/analytics-browser";
import { QueueLink } from "./queue-link";

interface QueueListProps {
  queue: Queue;
  current: string;
  topic: string;
  href: (id: string) => string;
}

function centerCurrent(list: HTMLElement, current: string) {
  const row = list.querySelector<HTMLElement>(`[href$="/bank/${current}"]`);
  if (row)
    list.scrollTop = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
}

const sections = ["visit", "upcoming"] as const;

export function QueueList({ queue, current, topic, href }: QueueListProps) {
  const t = useTranslations("Solve");
  const lists = arrange(queue, current);
  const list = useRef<HTMLDivElement>(null);
  const known = sections.some((key) =>
    lists[key].some((task) => task.id === current),
  );

  useLayoutEffect(() => {
    if (known && list.current) centerCurrent(list.current, current);
  }, [known, current]);

  return (
    <div
      ref={list}
      className="relative min-h-0 flex-1 overflow-y-auto border-t px-2 pb-3"
    >
      {sections.map((key) =>
        lists[key].length ? (
          <Fragment key={key}>
            <RailHeading>{t(key)}</RailHeading>
            {lists[key].map((task, i) => (
              <QueueLink
                key={task.id}
                task={task}
                href={href(task.id)}
                intent={intentOf({
                  via: "picker",
                  placement: `rail_${key}`,
                  rank: i + 1,
                })}
                current={key === "visit" && task.id === current}
                page={current}
                next={key === "upcoming"}
                recommendation={
                  key === "upcoming"
                    ? recommendationOf("rail_upcoming", topic, task, i + 1)
                    : undefined
                }
              />
            ))}
          </Fragment>
        ) : null,
      )}
    </div>
  );
}
