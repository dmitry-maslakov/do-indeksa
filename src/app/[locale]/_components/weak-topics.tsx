import { useLocale, useTranslations } from "next-intl";
import { PracticeLinks } from "@/components/practice-links";
import { ProgressBar } from "@/components/progress-bar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { topicName } from "@/content/topics";
import type { Accuracy } from "@/lib/stats";
import { EmptyNote } from "./empty-note";

export function WeakTopics({
  topics,
  signedIn,
}: {
  topics: (Accuracy & { pct: number })[];
  signedIn: boolean;
}) {
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>{t("weaker")}</CardTitle>
        <CardDescription>{t("days30")}</CardDescription>
      </CardHeader>
      {topics.length === 0 && (
        <EmptyNote
          text={t("weakEmpty")}
          signedIn={signedIn}
          href="/variants/daily"
          action={t("playDaily")}
        />
      )}
      <ul className="flex flex-col gap-3 text-[13px] empty:hidden">
        {topics.map((topic) => (
          <li key={topic.key} className="flex flex-col gap-1.5">
            <div className="flex justify-between gap-3">
              <span className="truncate">
                {topicName(String(topic.key), locale)}
              </span>
              <span className="shrink-0">
                <b className="font-semibold">{topic.pct}%</b>{" "}
                <span className="text-subtle">
                  · {t("attemptsShort", { count: topic.total })}
                </span>
              </span>
            </div>
            <ProgressBar value={topic.pct / 100} />
          </li>
        ))}
      </ul>
      <PracticeLinks
        topics={topics.map((topic) => ({
          id: String(topic.key),
          name: topicName(String(topic.key), locale),
        }))}
      />
    </Card>
  );
}
