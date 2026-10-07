import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import type { totals } from "@/lib/stats";

interface TotalsCardProps {
  totals: ReturnType<typeof totals>;
  runs: number;
}

export function TotalsCard({ totals, runs }: TotalsCardProps) {
  const t = useTranslations("Stats");
  const hours = Math.round(totals.spentMs / 3_600_000);
  const items = [
    [String(totals.solved), t("solved")],
    [
      totals.firstTryPct === null ? "—" : `${totals.firstTryPct}%`,
      t("firstTry"),
    ],
    [String(runs), t("runs")],
    [t("hours", { hours }), t("spent")],
  ];

  return (
    <Card className="grid grid-cols-2 gap-5">
      {items.map(([value, label]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <span className="font-bold text-3xl tracking-tight">{value}</span>
          <span className="text-sm text-subtle">{label}</span>
        </div>
      ))}
    </Card>
  );
}
