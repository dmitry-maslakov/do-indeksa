"use client";

import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import type { UnfinishedTest } from "@/features/exam/test-sessions";
import { answeredCount } from "@/features/exam/test-state";
import { useLatestTest } from "@/features/exam/use-latest-test";
import { Link } from "@/i18n/navigation";

export function ResumeTest({ saved }: { saved?: UnfinishedTest }) {
  const t = useTranslations("Home");
  const test = useLatestTest(saved);
  if (!test) return null;

  return (
    <section className="flex items-center gap-4 rounded-xl bg-muted px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{test.title}</p>
        <p className="text-muted-foreground text-sm">
          {t("progress", {
            done: answeredCount({ current: -1, answers: test.answers }),
            total: test.answers.length,
          })}
        </p>
      </div>
      <Link
        href={`/variants/${test.variantId}`}
        className={buttonVariants({ size: "sm" })}
      >
        {t("continue")}
      </Link>
    </section>
  );
}
