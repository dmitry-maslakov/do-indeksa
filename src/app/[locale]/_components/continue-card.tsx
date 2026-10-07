"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VariantStrip } from "@/components/variant-strip";
import { Link } from "@/i18n/navigation";
import { useExamHydrated, useExamStore } from "@/lib/exam-store";
import type { Segment } from "@/lib/strip";

interface ContinueCardProps {
  titles: Record<string, string>;
  start: { id: string; title: string; tasks: number; minutes: number };
}

export function ContinueCard({ titles, start }: ContinueCardProps) {
  const t = useTranslations("Home");
  const variants = useTranslations("Variants");
  const hydrated = useExamHydrated();
  const runs = useExamStore((s) => s.runs);

  const [variantId, run] = hydrated
    ? (Object.entries(runs).sort(
        ([, a], [, b]) => b.startedAt - a.startedAt,
      )[0] ?? [])
    : [];

  const done = run ? run.answers.filter((a) => a.some(Boolean)).length : 0;
  const total = run ? run.answers.length : start.tasks;
  const segments: Segment[] = run
    ? run.answers.map((a, i) =>
        i === run.current ? "current" : a.some(Boolean) ? "done" : "none",
      )
    : Array.from({ length: start.tasks }, () => "none");
  const title = !variantId
    ? start.title
    : (titles[variantId] ??
      (variantId.startsWith("daily-")
        ? variants("daily")
        : variants("random")));

  return (
    <Card className="gap-4 md:p-8">
      <div className="flex justify-between gap-3 text-sm text-subtle">
        <span>{run ? t("continue") : t("startNext")}</span>
        <span>
          {run
            ? t("progress", { done, total })
            : variants("format", { tasks: total, minutes: start.minutes })}
        </span>
      </div>
      <span className="font-semibold text-[22px] tracking-tight">{title}</span>
      <VariantStrip
        segments={segments}
        label={t("progress", { done, total })}
      />
      <Button
        variant="secondary"
        className="self-end"
        render={<Link href={`/variants/${variantId ?? start.id}`} />}
        nativeButton={false}
      >
        {run ? t("continue") : variants("start")}
      </Button>
    </Card>
  );
}
