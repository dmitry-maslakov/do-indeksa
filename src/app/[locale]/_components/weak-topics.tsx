import { useLocale, useTranslations } from "next-intl";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { topicName } from "@/content/topics";
import { Link } from "@/i18n/navigation";
import type { Accuracy } from "@/lib/stats";

export function WeakTopics({
  topics,
}: {
  topics: (Accuracy & { pct: number })[];
}) {
  const t = useTranslations("Home");
  const locale = useLocale();
  if (topics.length === 0) return null;

  return (
    <Card className="gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-lg">{t("weaker")}</h2>
        <span className="text-sm text-subtle">{t("days30")}</span>
      </div>
      <ul className="flex flex-col gap-3.5 text-sm">
        {topics.map((topic) => (
          <li key={topic.key} className="flex flex-col gap-1.5">
            <div className="flex justify-between gap-3">
              <span className="truncate">
                {topicName(String(topic.key), locale)}
              </span>
              <span className="shrink-0">
                <b className="font-semibold">{topic.pct}%</b>{" "}
                <span className="text-subtle">· {topic.total}</span>
              </span>
            </div>
            <ProgressBar value={topic.pct / 100} />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        {topics.slice(0, 2).map((topic) => (
          <Button
            key={topic.key}
            size="sm"
            variant="tint"
            render={<Link href={`/bank?topic=${topic.key}`} />}
            nativeButton={false}
          >
            {t("practice", { topic: topicName(String(topic.key), locale) })}
          </Button>
        ))}
      </div>
    </Card>
  );
}
