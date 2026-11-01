"use client";

import { useTranslations } from "next-intl";
import { Fragment, use, useLayoutEffect, useRef } from "react";
import { RailHeading } from "@/components/rail";
import type { Queue } from "@/features/bank/queue/queue";
import { recommendationOf } from "@/features/bank/queue/recommendation";
import { intentOf } from "@/lib/analytics-browser";
import { QueueLink } from "./queue-link";

interface QueueListProps {
  queue: Promise<Queue>;
  current: string;
  topic: string;
  href: (id: string) => string;
}

function centerCurrent(list: HTMLElement) {
  const row = list.querySelector<HTMLElement>("[aria-current=page]");
  if (row)
    list.scrollTop = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
}

const sections = ["visit", "upcoming"] as const;

export function QueueList({ current, topic, href, ...props }: QueueListProps) {
  const t = useTranslations("Solve");
  const queue = use(props.queue);
  const list = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (list.current) centerCurrent(list.current);
  }, []);

  return (
    <div
      ref={list}
      className="relative min-h-0 flex-1 overflow-y-auto border-t px-2 pb-3"
    >
      {sections.map((key) =>
        queue[key].length ? (
          <Fragment key={key}>
            <RailHeading>{t(key)}</RailHeading>
            {queue[key].map((task, i) => (
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
