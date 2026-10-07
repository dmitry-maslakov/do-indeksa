"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useExamHydrated, useExamStore } from "@/lib/exam-store";
import type { Segment } from "@/lib/strip";
import { VariantStrip } from "./variant-strip";

interface VariantRowProps {
  id: string;
  title: string;
  tasks: number;
  latest?: { runId: string; segments: Segment[]; score: number; max: number };
}

export function VariantRow({ id, title, tasks, latest }: VariantRowProps) {
  const t = useTranslations("Variants");
  const hydrated = useExamHydrated();
  const run = useExamStore((s) => (hydrated ? s.runs[id] : undefined));
  const done = run?.answers.filter((a) => a.some(Boolean)).length ?? 0;

  const segments: Segment[] = run
    ? run.answers.map((a, i) =>
        i === run.current ? "current" : a.some(Boolean) ? "done" : "none",
      )
    : (latest?.segments ?? Array.from({ length: tasks }, () => "none"));

  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-3 px-5 py-4 text-sm md:grid-cols-[110px_minmax(0,1fr)_96px_auto] md:px-6",
        run && "bg-muted/60",
      )}
    >
      <span className="font-semibold">{title}</span>
      <VariantStrip
        segments={segments}
        label={t("strip", { count: segments.length })}
        className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto"
      />
      <span className="hidden text-[13px] md:block">
        {run ? (
          <span className="text-subtle">
            {t("inProgress", { done, total: tasks })}
          </span>
        ) : latest ? (
          <>
            <b className="font-semibold">{latest.score}</b>{" "}
            <span className="text-subtle">/ {latest.max}</span>
          </>
        ) : (
          <span className="text-subtle">{t("notSolved")}</span>
        )}
      </span>
      {run ? (
        <Button
          size="sm"
          render={<Link href={`/variants/${id}`} />}
          nativeButton={false}
        >
          {t("continue")}
        </Button>
      ) : latest ? (
        <Button
          size="sm"
          variant="ghost"
          render={<Link href={`/review?run=${latest.runId}`} />}
          nativeButton={false}
        >
          {t("review")}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="tint"
          render={<Link href={`/variants/${id}`} />}
          nativeButton={false}
        >
          {t("start")}
        </Button>
      )}
    </li>
  );
}
