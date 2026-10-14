import { cn } from "cn";
import { useLocale, useTranslations } from "next-intl";
import { EmptyNote } from "@/components/empty-note";
import { ProgressBar } from "@/components/progress-bar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type Accuracy, minSample } from "@/features/progress/stats";
import { PracticeLinks } from "@/features/review/practice-links";
import { topicName } from "@/features/tasks/topics";

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
  warming,
}: {
  topics?: (Accuracy & { pct: number })[];
  warming?: Accuracy[];
}) {
  const t = useTranslations("Home");
  const locale = useLocale();
  const rows = topics && [...topics, ...(warming ?? [])].slice(0, 4);

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>{t("weaker")}</CardTitle>
        <CardDescription>
          {topics?.length === 0 && rows?.length
            ? t("days30Gathering")
            : t("days30")}
        </CardDescription>
      </CardHeader>
      {!rows ? (
        ghost
      ) : rows.length === 0 ? (
        <EmptyNote
          text={t("weakEmpty")}
          signedIn
          href="/daily"
          action={t("playDaily")}
        />
      ) : (
        <>
          <ul className={list}>
            {rows.map((row) => (
              <li key={row.key} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-3">
                  <span
                    className={cn(
                      "truncate",
                      row.pct === null && "text-subtle",
                    )}
                  >
                    {topicName(String(row.key), locale)}
                  </span>
                  <span className="shrink-0">
                    <b
                      className={cn(
                        "font-semibold",
                        row.pct === null && "text-subtle",
                      )}
                    >
                      {row.pct === null ? "—" : `${row.pct}%`}
                    </b>{" "}
                    <span className="text-subtle">
                      · {t("attemptsShort", { count: row.total })}
                    </span>
                  </span>
                </div>
                {row.pct === null ? (
                  <span className="text-subtle">
                    {t("attemptsLeft", { count: minSample - row.total })}
                  </span>
                ) : (
                  <ProgressBar value={row.pct / 100} />
                )}
              </li>
            ))}
          </ul>
          <PracticeLinks
            topics={topics.map((row) => ({
              id: String(row.key),
              name: topicName(String(row.key), locale),
            }))}
          />
        </>
      )}
    </Card>
  );
}
