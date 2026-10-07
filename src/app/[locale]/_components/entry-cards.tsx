import { useLocale, useTranslations } from "next-intl";
import { Card, CardTitle } from "@/components/ui/card";
import { positions } from "@/content/exam";
import { topicName } from "@/content/topics";
import { curatedVariants, officialVariants } from "@/content/variants";
import { Link } from "@/i18n/navigation";

export function EntryCards() {
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,0.7fr)]">
      <Card size="sm" className="gap-3.5">
        <CardTitle>{t("byNumber")}</CardTitle>
        <div className="grid grid-cols-5 gap-1.5">
          {positions.map((p) => (
            <Link
              key={p.number}
              href={`/bank?number=${p.number}`}
              className="flex aspect-square items-center justify-center rounded-md bg-muted font-semibold text-xs hover:bg-data-tint hover:text-data"
            >
              {p.number}
            </Link>
          ))}
        </div>
        <span className="text-[13px] text-subtle">{t("byNumberHint")}</span>
      </Card>
      <Card size="sm" className="gap-3.5">
        <CardTitle>{t("byTopic")}</CardTitle>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
          {positions.slice(0, 7).map((p) => (
            <Link
              key={p.topic}
              href={`/bank?topic=${p.topic}`}
              className="truncate hover:text-data"
            >
              {topicName(p.topic, locale)}
            </Link>
          ))}
          {positions.length > 7 && (
            <Link href="/bank" className="text-subtle hover:text-data">
              {t("moreTopics", { count: positions.length - 7 })}
            </Link>
          )}
        </div>
      </Card>
      <Link href="/variants" className="rounded-3xl">
        <Card
          size="sm"
          className="h-full gap-2.5 transition-shadow hover:shadow-raised"
        >
          <CardTitle>{t("variants")}</CardTitle>
          <span className="text-sm text-subtle leading-relaxed">
            {t("official", { count: officialVariants.length })}
            <br />
            {t("curated", { count: curatedVariants.length })}
          </span>
          <span className="mt-auto font-semibold text-sm">{t("open")}</span>
        </Card>
      </Link>
    </div>
  );
}
