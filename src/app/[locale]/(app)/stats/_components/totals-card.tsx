import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { totals } from "@/lib/stats";

interface TotalsCardProps {
  totals?: ReturnType<typeof totals>;
  runs?: number;
}

export function TotalsCard({ totals, runs }: TotalsCardProps) {
  const t = useTranslations("Stats");
  const items = [
    [totals && String(totals.solved), t("solved")],
    [
      totals && (totals.firstTryPct === null ? "—" : `${totals.firstTryPct}%`),
      t("firstTry"),
    ],
    [runs?.toString(), t("runs")],
    [
      totals && t("hours", { hours: Math.round(totals.spentMs / 3_600_000) }),
      t("spent"),
    ],
  ];

  return (
    <Card className="grid grid-cols-2 gap-5">
      {items.map(([value, label]) => (
        <div key={label} className="flex flex-col gap-0.5">
          {value === undefined ? (
            <Skeleton className="my-2 h-5 w-14" />
          ) : (
            <span className="font-bold text-3xl tracking-tight">{value}</span>
          )}
          <span className="text-sm text-subtle">{label}</span>
        </div>
      ))}
    </Card>
  );
}
