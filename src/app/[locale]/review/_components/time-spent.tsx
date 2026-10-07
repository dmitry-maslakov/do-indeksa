import { useTranslations } from "next-intl";
import { StackBar } from "@/components/stack-bar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Review } from "@/lib/review";

export function TimeSpent({ review }: { review: Review }) {
  const t = useTranslations("Review");
  const spent = Math.round(review.spentMs / 60_000);
  const norm = Math.round(review.normMs / 60_000);
  const over = review.rows.filter((r) => r.over);

  return (
    <Card className="gap-3.5">
      <CardHeader>
        <CardTitle>{t("timeTitle")}</CardTitle>
        <CardDescription>{t("timeOf", { spent, norm })}</CardDescription>
      </CardHeader>
      <StackBar
        label={t("timeOf", { spent, norm })}
        parts={[
          ...review.rows.map((r) => ({
            key: r.taskId,
            value: r.attempt?.durationMs ?? 0,
            className: r.over ? "bg-overtime" : "bg-data",
          })),
          {
            key: "left",
            value: Math.max(review.normMs - review.spentMs, 0),
            className: "bg-untouched",
          },
        ]}
      />
      <p className="text-[13px] text-subtle leading-relaxed">
        {over.length > 0
          ? t("overNorm", { numbers: over.map((r) => r.number).join(", ") })
          : t("inNorm")}
      </p>
    </Card>
  );
}
