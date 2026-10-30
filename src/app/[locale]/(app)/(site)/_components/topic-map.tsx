"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useRef, useState } from "react";
import {
  type TopicState,
  topicStates,
} from "@/features/progress/topic-progress";
import { Link } from "@/i18n/navigation";
import { queueEvent } from "@/lib/analytics-browser";
import { TopicRow, type TopicRowProps } from "./topic-row";

interface TopicMapLinkProps {
  className: string;
  children: ReactNode;
}

export function TopicMapLink({ className, children }: TopicMapLinkProps) {
  return (
    <Link
      href="#topic-map"
      prefetch={false}
      onClick={() => queueEvent("control_used", { control: "other_topic" })}
      className={className}
    >
      {children}
    </Link>
  );
}

export function TopicMap({ rows }: { rows: TopicRowProps[] }) {
  const t = useTranslations("Home");
  const [filter, setFilter] = useState<TopicState>();
  const [minHeight, setMinHeight] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  return (
    <section id="topic-map" className="flex scroll-mt-4 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-lg tracking-tight">
          {t("topicMap")}
        </h2>
        <Link
          href="/stats"
          className="whitespace-nowrap font-semibold text-data text-xs"
        >
          {t("stats")}
        </Link>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none md:mx-0 md:flex-wrap md:px-0">
        {[undefined, ...topicStates].map((state) => (
          <button
            key={state ?? "all"}
            type="button"
            aria-pressed={filter === state}
            onClick={() => {
              setMinHeight((h) => Math.max(h, list.current?.offsetHeight ?? 0));
              setFilter(state);
              queueEvent("control_used", {
                control: "topic_map_filter",
                value: state ?? "all",
              });
            }}
            className="h-9 shrink-0 rounded-full bg-muted px-4 font-medium text-muted-foreground text-sm aria-pressed:bg-data-tint aria-pressed:font-bold aria-pressed:text-data"
          >
            {state
              ? t(`state.${state}`)
              : t("allTopics", { count: rows.length })}
          </button>
        ))}
      </div>
      <ul
        ref={list}
        style={{ minHeight }}
        className="grid content-start xl:grid-cols-2 xl:gap-x-8"
      >
        {rows
          .filter((row) => !filter || row.state === filter)
          .map((row) => (
            <TopicRow key={row.topic} {...row} />
          ))}
      </ul>
    </section>
  );
}
