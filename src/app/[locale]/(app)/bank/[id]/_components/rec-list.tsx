"use client";

import { useTranslations } from "next-intl";
import { Fragment, useLayoutEffect, useRef } from "react";
import { RailHeading } from "@/components/rail";
import type { Queue } from "@/features/bank/queue";
import { QueueLink } from "./rail-row";
import { centerCurrent } from "./scroll";

interface RecListProps {
  queue: Queue;
  current: string;
  href: (id: string) => string;
}

const sections = ["earlier", "today", "upcoming"] as const;

export function RecList({ queue, current, href }: RecListProps) {
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
