"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VariantStrip } from "@/components/variant-strip";
import type { CurrentRun } from "@/features/exam/current-run";
import {
  type ExamRun,
  useExamHydrated,
  useExamStore,
} from "@/features/exam/exam-store";
import {
  answeredCount,
  blankSegments,
  minutesLeft,
  nextIndex,
  runSegments,
} from "@/features/exam/run";
import { Link } from "@/i18n/navigation";
import type { Segment } from "@/lib/strip";

interface ContinueCardProps {
  start: { id: string; title: string; tasks: number; minutes: number };
  account?: CurrentRun;
}

const newest = (candidates: [string, ExamRun][]) =>
  candidates.reduce<[string, ExamRun] | undefined>(
    (best, candidate) =>
      !best || candidate[1].updatedAt > best[1].updatedAt ? candidate : best,
    undefined,
  );

export function ContinueCard({ start, account }: ContinueCardProps) {
  const t = useTranslations("Home");
  const variants = useTranslations("Variants");
  const hydrated = useExamHydrated();
  const runs = useExamStore((s) => s.runs);
  const candidates: [string, ExamRun][] = hydrated ? Object.entries(runs) : [];
  if (account) candidates.push([account.variantId, account.run]);
  const [variantId, run] = newest(candidates) ?? [];

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
  const next = index === undefined ? undefined : run.tasks[index];

  return (
    <Shell
      label={t("continue")}
      meta={
        left === undefined
          ? t("progress", { done, total })
          : t("progressLeft", { done, total, minutes: left })
      }
      title={run.title}
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
    <Card size="lg" className="gap-4">
      <div className="flex justify-between gap-3 text-[13px] text-subtle">
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
