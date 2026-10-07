"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VariantStrip } from "@/components/variant-strip";
import { Link } from "@/i18n/navigation";
import { type ExamRun, useExamHydrated, useExamStore } from "@/lib/exam-store";
import type { Segment } from "@/lib/strip";

interface ContinueCardProps {
  titles: Record<string, string>;
  start: { id: string; title: string; tasks: number; minutes: number };
}

const answered = (a: string[]) => a.some(Boolean);

function nextOf(run: ExamRun) {
  const order = [run.current, ...run.answers.keys()];
  const index = order.find((i) => !answered(run.answers[i] ?? []));
  return index === undefined ? undefined : run.tasks?.[index];
}

function minutesLeft(run: ExamRun) {
  if (!run.timed || !run.minutes) return undefined;
  const ms = run.startedAt + run.minutes * 60_000 - Date.now();
  return Math.max(Math.round(ms / 60_000), 0);
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
    const segments: Segment[] = Array.from(
      { length: start.tasks },
      () => "none",
    );
    return (
      <Shell
        label={t("startNext")}
        meta={variants("format", {
          tasks: start.tasks,
          minutes: start.minutes,
        })}
        title={start.title}
        segments={segments}
        href={`/variants/${start.id}`}
        action={variants("start")}
      />
    );
  }

  const done = run.answers.filter(answered).length;
  const total = run.answers.length;
  const left = minutesLeft(run);
  const next = nextOf(run);

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
        (variantId.startsWith("daily-")
          ? variants("daily")
          : variants("random"))
      }
      segments={run.answers.map((a, i) =>
        i === run.current ? "current" : answered(a) ? "done" : "none",
      )}
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
