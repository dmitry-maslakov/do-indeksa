"use client";

import { PanelLeftCloseIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { LinkTabs } from "@/components/link-tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { VariantStrip } from "@/components/variant-strip";
import type { TaskStatus } from "@/features/progress/status";
import { statusSegment } from "@/features/progress/status";
import type { RailTask } from "@/features/tasks/task-row";
import { useRouter } from "@/i18n/navigation";
import { useStoredFlag } from "@/lib/use-stored-flag";
import { RailList } from "./rail-list";
import { RailNumbers } from "./rail-numbers";

export interface SolveRailProps {
  current: string;
  topic: string;
  rail: (RailTask & { meta: string })[];
  topics: { id: string; name: string; first: string }[];
  statuses?: Record<string, TaskStatus>;
}

export function SolveRail({
  current,
  topic,
  rail,
  topics,
  statuses,
}: SolveRailProps) {
  const t = useTranslations("Solve");
  const router = useRouter();
  const [collapsed, toggle] = useStoredFlag("do-indeksa-rail-collapsed");

  if (collapsed) {
    return (
      <RailNumbers
        ids={rail.map((s) => s.id)}
        current={current}
        statuses={statuses ?? {}}
        onExpand={toggle}
      />
    );
  }

  const right = rail.filter((s) => statuses?.[s.id] === "solved").length;
  const wrong = rail.filter((s) => statuses?.[s.id] === "wrong").length;
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
            {statuses
              ? t("doneOf", { done: right + wrong, total: rail.length })
              : t("inTopic", { count: rail.length })}
          </span>
          {statuses && <span>{t("tally", { right, wrong })}</span>}
        </div>
        <VariantStrip
          size="sm"
          label={t("tally", { right, wrong })}
          segments={rail.map((s) =>
            s.id === current ? "current" : statusSegment(statuses?.[s.id]),
          )}
        />
      </div>
      <RailList
        rail={rail}
        current={current}
        statuses={statuses}
        marks={marks}
      />
    </Card>
  );
}
