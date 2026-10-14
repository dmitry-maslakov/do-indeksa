import { connection } from "next/server";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { belgradeDate } from "@/lib/dates";
import { getVariant, minutesOf } from "./variants";

export function DailyBanner() {
  const t = useTranslations("Variants");

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-daily px-[18px] py-3.5 text-white">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-semibold text-sm">{t("daily")}</span>
        <Suspense
          fallback={<Skeleton className="my-0.5 h-3 w-32 bg-daily-muted/30" />}
        >
          <DailyMeta />
        </Suspense>
      </div>
      <Button
        size="sm"
        variant="inverse"
        render={<Link href="/daily" prefetch={false} />}
        nativeButton={false}
      >
        {t("start")}
      </Button>
    </div>
  );
}

async function DailyMeta() {
  await connection();
  const t = await getTranslations("Variants");
  const daily = getVariant(`daily-${belgradeDate()}`);
  if (!daily) throw new Error("no daily test");

  return (
    <span className="text-daily-muted text-xs">
      {t("dailyMeta", {
        tasks: daily.taskIds.length,
        minutes: minutesOf(daily),
      })}
    </span>
  );
}
