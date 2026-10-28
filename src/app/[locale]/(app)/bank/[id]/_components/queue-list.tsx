"use client";

import { useTranslations } from "next-intl";
import { Fragment, useLayoutEffect, useRef } from "react";
import { RailHeading } from "@/components/rail";
import type { Queue } from "@/features/bank/queue/queue";
import { QueueLink } from "./queue-link";

interface QueueListProps {
  queue: Queue;
  current: string;
  href: (id: string) => string;
}

function centerCurrent(list: HTMLElement) {
  const row = list.querySelector<HTMLElement>("[aria-current=page]");
  if (row)
    list.scrollTop = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
}

const sections = ["earlier", "today", "upcoming"] as const;

export function QueueList({ queue, current, href }: QueueListProps) {
  const t = useTranslations("Solve");
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
            {queue[key].map((task) => (
              <QueueLink
                key={task.id}
                task={task}
                href={href(task.id)}
                current={key === "today" && task.id === current}
                next={key === "upcoming"}
              />
            ))}
          </Fragment>
        ) : null,
      )}
    </div>
  );
}
