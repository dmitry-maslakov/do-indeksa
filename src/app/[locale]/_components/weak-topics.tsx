import { useLocale, useTranslations } from "next-intl";
import { EmptyNote } from "@/components/empty-note";
import { PracticeLinks } from "@/components/practice-links";
import { ProgressBar } from "@/components/progress-bar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { topicName } from "@/content/topics";
import type { Accuracy } from "@/lib/stats";

const list = "flex flex-col gap-3 text-[13px]";

const ghost = (
  <ul className={list}>
    {[60, 45, 70].map((width) => (
      <li key={width} className="flex flex-col gap-2.5 py-0.5">
        <Skeleton className="h-3" style={{ width: `${width}%` }} />
        <Skeleton className="h-2.5" />
      </li>
    ))}
  </ul>
);

export function WeakTopics({
  topics,
  signedIn,
}: {
  topics?: (Accuracy & { pct: number })[];
  signedIn?: boolean;
}) {
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>{t("weaker")}</CardTitle>
        <CardDescription>{t("days30")}</CardDescription>
      </CardHeader>
      {!topics ? (
        ghost
      ) : topics.length === 0 ? (
        <EmptyNote
          text={t("weakEmpty")}
          signedIn={Boolean(signedIn)}
          href="/daily"
          action={t("playDaily")}
        />
      ) : (
        <>
          <ul className={list}>
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
        </>
      )}
    </Card>
  );
}
