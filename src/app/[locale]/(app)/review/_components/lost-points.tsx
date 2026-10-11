import { useTranslations } from "next-intl";
import { StackBar } from "@/components/stack-bar";
import { Card, CardTitle } from "@/components/ui/card";
import type { Review } from "@/lib/review";

const tones = ["bg-data", "bg-data-soft", "bg-data/40", "bg-data/20"];

export function LostPoints({
  review,
  names,
}: {
  review: Review;
  names: Record<string, string>;
}) {
  const t = useTranslations("Review");
  const top = review.lost.slice(0, tones.length);
  if (top.length === 0) return null;
  const name = (topic: string | null) =>
    topic ? (names[topic] ?? topic) : t("skippedTopic");

  return (
    <Card className="gap-3.5">
      <CardTitle>{t("lost")}</CardTitle>
      <StackBar
        label={t("lost")}
        parts={top.map((l, i) => ({
          key: l.topic ?? "skipped",
          value: l.points,
          className: tones[i] ?? "",
        }))}
      />
      <ul className="flex flex-col gap-2 text-sm">
        {top.map((l, i) => (
          <li
            key={l.topic ?? "skipped"}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex items-center gap-2">
              <i className={`size-2.5 rounded-full ${tones[i]}`} />
              {name(l.topic)}
            </span>
            <b className="font-semibold">−{l.points}</b>
          </li>
        ))}
      </ul>
    </Card>
  );
}
