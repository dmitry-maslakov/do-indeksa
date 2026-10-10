import { useTranslations } from "next-intl";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { durationHours, maxPoints, positions } from "@/content/exam";
import { byPosition } from "@/content/variants";
import { Link } from "@/i18n/navigation";

export function Intro() {
  const t = useTranslations("Home");

  return (
    <section className="flex flex-col gap-3 md:col-span-2">
      <PageTitle className="p-0">{t("title")}</PageTitle>
      <p className="max-w-2xl text-subtle">
        {t("lead", {
          tasks: positions.length,
          hours: durationHours,
          points: maxPoints,
        })}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="max-sm:w-full"
          render={<Link href={`/bank/${byPosition[0]?.[0]}`} />}
          nativeButton={false}
        >
          {t("firstTask")}
        </Button>
        <span className="text-[13px] text-subtle">{t("firstTaskHint")}</span>
      </div>
    </section>
  );
}
