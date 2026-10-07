"use client";

import { useTranslations } from "next-intl";
import { SignInButton } from "@/components/sign-in-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { VariantStrip } from "@/components/variant-strip";
import type { ExamTask } from "@/content/variants";
import { Link } from "@/i18n/navigation";
import { segmentOf } from "@/lib/strip";
import type { RunResult } from "@/server/runs";

interface ExamResultProps {
  tasks: ExamTask[];
  result: RunResult;
  onRetry: () => void;
}

export function ExamResult({ tasks, result, onRetry }: ExamResultProps) {
  const t = useTranslations("Exam");
  const score =
    Math.round(result.points.reduce((sum, p) => sum + p, 0) * 10) / 10;
  const max = tasks.reduce((sum, task) => sum + task.points, 0);
  const segments = result.parts.map((parts, i) =>
    result.answered[i] ? segmentOf(parts) : "none",
  );

  return (
    <Card className="max-w-3xl gap-6 md:p-9">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <CardTitle>{t("result")}</CardTitle>
        <span className="text-sm text-subtle">
          <b className="font-bold text-3xl text-foreground">{score}</b> / {max}
        </span>
      </div>
      <VariantStrip
        size="lg"
        segments={segments}
        label={t("strip", { score, max })}
      />
      <ul className="flex flex-col divide-y divide-subtle/15 text-sm">
        {tasks.map((task, i) => (
          <li key={task.id} className="flex items-center gap-3 py-3">
            <span className="w-8 font-semibold">{task.number}</span>
            <span className="min-w-0 flex-1 truncate">{task.topicName}</span>
            {(result.points[i] ?? 0) > 0 ? (
              <Badge variant="success" size="sm">
                +{result.points[i]}
              </Badge>
            ) : (
              <Badge
                variant={segments[i] === "none" ? "default" : "error"}
                size="sm"
              >
                0
              </Badge>
            )}
          </li>
        ))}
      </ul>
      {!result.saved && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted px-5 py-4 text-sm">
          <span>{t("guest")}</span>
          <SignInButton size="sm" variant="tint">
            {t("signIn")}
          </SignInButton>
        </div>
      )}
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
  );
}
