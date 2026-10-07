"use client";

import { cn } from "cn";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LinkTabs } from "@/components/link-tabs";
import { TaskRow } from "@/components/task-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { VariantStrip } from "@/components/variant-strip";
import type { TaskSummary } from "@/content/tasks";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import type { TaskStatus } from "@/lib/progress";
import { getStatuses } from "@/server/statuses";

interface SolveRailProps {
  current: string;
  topic: string;
  rail: (TaskSummary & { meta: string })[];
  topics: { id: string; name: string; first: string }[];
}

const KEY = "do-indeksa-rail";

export function SolveRail({ current, topic, rail, topics }: SolveRailProps) {
  const t = useTranslations("Solve");
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(KEY) === "collapsed");
    } catch {}
  }, []);

  useEffect(() => {
    if (session) getStatuses().then(setStatuses);
  }, [session]);

  function toggle() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(KEY, c ? "open" : "collapsed");
      } catch {}
      return !c;
    });
  }

  const right = rail.filter((s) => statuses[s.id] === "solved").length;
  const wrong = rail.filter((s) => statuses[s.id] === "wrong").length;

  if (collapsed) {
    return (
      <Card
        data-rail="collapsed"
        size="sm"
        className="order-last items-center gap-2 md:order-none"
      >
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={toggle}
          aria-label={t("expand")}
        >
          <PanelLeftOpenIcon />
        </Button>
        {rail.map((s, i) => (
          <Link
            key={s.id}
            href={`/bank/${s.id}`}
            aria-current={s.id === current ? "page" : undefined}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg border border-border font-semibold text-[13px] text-subtle",
              statuses[s.id] === "solved" && "border-0 bg-data-tint text-data",
              statuses[s.id] === "wrong" &&
                "border-0 bg-error-tint text-error-text",
              s.id === current && "border-0 bg-primary text-primary-foreground",
            )}
          >
            {i + 1}
          </Link>
        ))}
      </Card>
    );
  }

  return (
    <Card size="sm" className="order-last gap-4 md:order-none">
      <div className="flex items-center justify-between gap-2 px-1">
        <LinkTabs
          variant="underline"
          items={[
            { href: "/bank", label: t("list"), active: false },
            { href: `/bank/${current}`, label: t("solve"), active: true },
          ]}
        />
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={toggle}
          aria-label={t("collapse")}
          className="hidden md:inline-flex"
        >
          <PanelLeftCloseIcon />
        </Button>
      </div>
      <NativeSelect
        className="w-full"
        aria-label={t("topic")}
        value={topic}
        onChange={(e) => {
          const next = topics.find((x) => x.id === e.target.value);
          if (next) router.push(`/bank/${next.first}`);
        }}
      >
        {topics.map((x) => (
          <NativeSelectOption key={x.id} value={x.id}>
            {x.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <div className="flex flex-col gap-2 px-1">
        <div className="flex justify-between gap-2 whitespace-nowrap text-[13px] text-subtle">
          <span>
            {session
              ? t("doneOf", { done: right + wrong, total: rail.length })
              : t("inTopic", { count: rail.length })}
          </span>
          {session && <span>{t("tally", { right, wrong })}</span>}
        </div>
        <VariantStrip
          size="sm"
          label={t("tally", { right, wrong })}
          segments={rail.map((s) =>
            s.id === current
              ? "current"
              : statuses[s.id] === "solved"
                ? "done"
                : statuses[s.id] === "wrong"
                  ? "error"
                  : "none",
          )}
        />
      </div>
      <nav className="flex flex-col gap-0.5">
        {rail.map((s) => (
          <TaskRow
            key={s.id}
            task={s}
            active={s.id === current}
            meta={
              statuses[s.id] === "solved"
                ? `${s.meta} · ${t("solvedMark")}`
                : statuses[s.id] === "wrong"
                  ? `${s.meta} · ${t("wrongMark")}`
                  : s.meta
            }
            status={statuses[s.id]}
          />
        ))}
      </nav>
    </Card>
  );
}
