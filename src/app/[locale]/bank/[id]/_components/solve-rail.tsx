"use client";

import { PanelLeftCloseIcon } from "lucide-react";
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
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import type { TaskStatus } from "@/lib/progress";
import { statusSegment } from "@/lib/strip";
import { useStoredFlag } from "@/lib/use-stored-flag";
import { getStatuses } from "@/server/statuses";
import { RailNumbers } from "./rail-numbers";

interface SolveRailProps {
  current: string;
  topic: string;
  rail: (TaskSummary & { meta: string })[];
  topics: { id: string; name: string; first: string }[];
}

export function SolveRail({ current, topic, rail, topics }: SolveRailProps) {
  const t = useTranslations("Solve");
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>({});
  const [collapsed, toggle] = useStoredFlag("do-indeksa-rail-collapsed");

  const userId = session?.user.id;

  useEffect(() => {
    if (userId) getStatuses().then(setStatuses);
    else setStatuses({});
  }, [userId]);

  if (collapsed) {
    return (
      <RailNumbers
        ids={rail.map((s) => s.id)}
        current={current}
        statuses={statuses}
        onExpand={toggle}
      />
    );
  }

  const right = rail.filter((s) => statuses[s.id] === "solved").length;
  const wrong = rail.filter((s) => statuses[s.id] === "wrong").length;
  const marks: Partial<Record<TaskStatus, string>> = {
    solved: t("solvedMark"),
    wrong: t("wrongMark"),
  };

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
            s.id === current ? "current" : statusSegment(statuses[s.id]),
          )}
        />
      </div>
      <nav className="flex flex-col gap-0.5">
        {rail.map((s) => {
          const mark = marks[statuses[s.id] ?? "new"];
          return (
            <TaskRow
              key={s.id}
              task={s}
              active={s.id === current}
              meta={mark ? `${s.meta} · ${mark}` : s.meta}
              status={statuses[s.id]}
            />
          );
        })}
      </nav>
    </Card>
  );
}
