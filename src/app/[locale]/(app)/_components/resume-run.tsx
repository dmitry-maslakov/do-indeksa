"use client";

import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import type { CurrentRun } from "@/features/exam/current-run";
import { answeredCount } from "@/features/exam/run";
import { useLatestRun } from "@/features/exam/use-latest-run";
import { Link } from "@/i18n/navigation";

export function ResumeRun({ account }: { account?: CurrentRun }) {
  const t = useTranslations("Home");
  const [variantId, run] = useLatestRun(account) ?? [];
  if (!variantId || !run) return null;

  return (
    <section className="flex items-center gap-4 rounded-xl bg-muted px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{run.title}</p>
        <p className="text-muted-foreground text-sm">
          {t("progress", {
            done: answeredCount(run),
            total: run.answers.length,
          })}
        </p>
      </div>
      <Link
        href={`/variants/${variantId}`}
        className={buttonVariants({ size: "sm" })}
      >
        {t("continue")}
      </Link>
    </section>
  );
}
