"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VariantStrip } from "@/components/variant-strip";
import { Link } from "@/i18n/navigation";
import { useExamHydrated, useExamStore } from "@/lib/exam-store";
import {
  answeredCount,
  blankSegments,
  minutesLeft,
  nextIndex,
  runSegments,
} from "@/lib/run";
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

  if (!variantId || !run) {
    return (
      <Shell
        label={t("startNext")}
        meta={variants("format", {
          tasks: start.tasks,
          minutes: start.minutes,
        })}
        title={start.title}
        segments={blankSegments(start.tasks)}
        href={`/variants/${start.id}`}
        action={variants("start")}
      />
    );
  }

  const done = answeredCount(run);
  const total = run.answers.length;
  const left = minutesLeft(run, Date.now());
  const index = nextIndex(run);
  const next = index === undefined ? undefined : run.tasks?.[index];

  return (
    <Shell
      label={t("continue")}
      meta={
        left === undefined
          ? t("progress", { done, total })
          : t("progressLeft", { done, total, minutes: left })
      }
      title={
        run.title ??
        titles[variantId] ??
        variants(variantId.startsWith("daily-") ? "daily" : "random")
      }
      segments={runSegments(run)}
      hint={next && t("next", { number: next.number, topic: next.topic })}
      href={`/variants/${variantId}`}
      action={t("continue")}
    />
  );
}

interface ShellProps {
  label: string;
  meta: string;
  title: string;
  segments: Segment[];
  hint?: string;
  href: string;
  action: string;
}

function Shell({
  label,
  meta,
  title,
  segments,
  hint,
  href,
  action,
}: ShellProps) {
  return (
    <Card className="gap-4 md:p-8">
      <div className="flex justify-between gap-3 text-sm text-subtle">
        <span>{label}</span>
        <span>{meta}</span>
      </div>
      <span className="font-semibold text-[22px] tracking-tight">{title}</span>
      <VariantStrip segments={segments} label={meta} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-subtle">{hint}</span>
        <Button
          variant="secondary"
          render={<Link href={href} />}
          nativeButton={false}
        >
          {action}
        </Button>
      </div>
    </Card>
  );
}
