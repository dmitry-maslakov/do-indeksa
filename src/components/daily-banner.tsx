import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function DailyBanner({
  tasks,
  minutes,
}: {
  tasks: number;
  minutes: number;
}) {
  const t = useTranslations("Variants");

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-daily px-[18px] py-3.5 text-white">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-semibold text-sm">{t("daily")}</span>
        <span className="text-daily-muted text-xs">
          {t("dailyMeta", { tasks, minutes })}
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
