"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { VariantStrip } from "@/components/variant-strip";
import { SignInButton } from "@/features/account/sign-in-button";
import { review } from "@/features/review/review";
import { ReviewRows } from "@/features/review/review-rows";
import { Link } from "@/i18n/navigation";
import type { GuestResult } from "./run-actions";
import type { ExamTask } from "./variants";

interface ExamResultProps {
  tasks: ExamTask[];
  result: GuestResult;
  onRetry: () => void;
}

export function ExamResult({ tasks, result, onRetry }: ExamResultProps) {
  const t = useTranslations("Exam");
  const summary = review(
    tasks.map((task) => ({ ...task, taskId: task.id })),
    result.attempts,
  );

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Card className="gap-6 md:p-9">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle>{t("result")}</CardTitle>
          <span className="text-sm text-subtle">
            <b className="font-bold text-3xl text-foreground">
              {summary.score}
            </b>{" "}
            / {summary.max}
          </span>
        </div>
        <VariantStrip
          size="lg"
          segments={summary.rows.map((r) => r.segment)}
          label={t("strip", { score: summary.score, max: summary.max })}
        />
        <p className="text-[13px] text-subtle">{t("estimate")}</p>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted px-5 py-4 text-sm">
          <span>{t("guest")}</span>
          <SignInButton size="sm" variant="tint">
            {t("signIn")}
          </SignInButton>
        </div>
        <div className="flex flex-wrap justify-between gap-3">
          <Button
            variant="ghost"
            render={<Link href="/variants" />}
            nativeButton={false}
          >
            {t("back")}
          </Button>
          <Button onClick={onRetry}>{t("retry")}</Button>
        </div>
      </Card>
      <ReviewRows review={summary} tasks={tasks} outcomes={result.outcomes} />
    </div>
  );
}
