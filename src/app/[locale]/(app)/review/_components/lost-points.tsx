import { orderBy } from "es-toolkit";
import { useTranslations } from "next-intl";
import { TopicIcon } from "@/features/catalog/topic-icon";
import { topicLook } from "@/features/catalog/topics";
import type { Review } from "@/features/review/review";

export function LostPoints({
  review,
  names,
}: {
  review: Review;
  names: Record<string, string>;
}) {
  const t = useTranslations("Review");
  const variants = useTranslations("Variants");
  const lost = orderBy(
    review.rows.filter((r) => r.earned < r.points),
    [(r) => r.points - r.earned],
    ["desc"],
  ).slice(0, 5);
  if (lost.length === 0) return null;

  return (
    <section className="flex flex-col gap-1">
      <h2 className="font-semibold text-lg">{t("lost")}</h2>
      <ul>
        {lost.map((row) => (
          <li
            key={row.taskId}
            className="flex items-center gap-3 border-b py-2.5"
          >
            <TopicIcon {...topicLook(row.topic)} size="sm" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[15px]">
                {names[row.topic] ?? row.topic}
              </span>
              <span className="text-subtle text-xs">
                {row.segment === "partial"
                  ? variants("result.part")
                  : row.attempt
                    ? variants("result.no")
                    : t("skipped")}
              </span>
            </span>
            <span className="font-semibold text-[15px] tabular-nums">
              −{Math.round((row.points - row.earned) * 10) / 10}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
