"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VariantStrip } from "@/components/variant-strip";
import { Link } from "@/i18n/navigation";
import { useExamHydrated, useExamStore } from "@/lib/exam-store";

export function ContinueCard({ titles }: { titles: Record<string, string> }) {
  const t = useTranslations("Home");
  const variants = useTranslations("Variants");
  const hydrated = useExamHydrated();
  const runs = useExamStore((s) => s.runs);
  if (!hydrated) return null;

  const [variantId, run] =
    Object.entries(runs).sort(([, a], [, b]) => b.startedAt - a.startedAt)[0] ??
    [];
  if (!variantId || !run) return null;

  const done = run.answers.filter((a) => a.some(Boolean)).length;
  const title =
    titles[variantId] ??
    (variantId.startsWith("daily-") ? variants("daily") : variants("random"));

  return (
    <Card className="gap-4 md:p-8">
      <div className="flex justify-between gap-3 text-sm text-subtle">
        <span>{t("continue")}</span>
        <span>{t("progress", { done, total: run.answers.length })}</span>
      </div>
      <span className="font-semibold text-[22px] tracking-tight">{title}</span>
      <VariantStrip
        segments={run.answers.map((a, i) =>
          i === run.current ? "current" : a.some(Boolean) ? "done" : "none",
        )}
        label={t("progress", { done, total: run.answers.length })}
      />
      <Button
        variant="secondary"
        className="self-end"
        render={<Link href={`/variants/${variantId}`} />}
        nativeButton={false}
      >
        {t("continue")}
      </Button>
    </Card>
  );
}
