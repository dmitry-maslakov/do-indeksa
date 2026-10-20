"use client";

import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { answeredCount } from "@/features/exam/run";
import type { UnfinishedTest } from "@/features/exam/test-sessions";
import { useLatestRun } from "@/features/exam/use-latest-run";
import { Link } from "@/i18n/navigation";

export function ResumeRun({ saved }: { saved?: UnfinishedTest }) {
  const t = useTranslations("Home");
  const run = useLatestRun(saved);
  if (!run) return null;

  return (
    <section className="flex items-center gap-4 rounded-xl bg-muted px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{run.title}</p>
        <p className="text-muted-foreground text-sm">
          {t("progress", {
            done: answeredCount({ current: -1, answers: run.answers }),
            total: run.answers.length,
          })}
        </p>
      </div>
      <Link
        href={`/variants/${run.variantId}`}
        className={buttonVariants({ size: "sm" })}
      >
        {t("continue")}
      </Link>
    </section>
  );
}
