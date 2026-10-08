import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { belgradeDate, getVariant, minutesOf } from "@/content/variants";
import { Link } from "@/i18n/navigation";

export function DailyBanner() {
  const t = useTranslations("Variants");
  const daily = getVariant(`daily-${belgradeDate()}`);
  if (!daily) throw new Error("no daily test");

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-daily px-[18px] py-3.5 text-white">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-semibold text-sm">{t("daily")}</span>
        <span className="text-daily-muted text-xs">
          {t("dailyMeta", {
            tasks: daily.taskIds.length,
            minutes: minutesOf(daily),
          })}
        </span>
      </div>
      <Button
        size="sm"
        variant="inverse"
        render={<Link href="/variants/daily" prefetch={false} />}
        nativeButton={false}
      >
        {t("play")}
      </Button>
    </div>
  );
}
