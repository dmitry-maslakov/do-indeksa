import { useTranslations } from "next-intl";
import { StackBar } from "@/components/stack-bar";
import { Card } from "@/components/ui/card";
import type { totals } from "@/lib/stats";

interface BankCardProps {
  totals: ReturnType<typeof totals>;
  size: number;
}

export function BankCard({ totals, size }: BankCardProps) {
  const t = useTranslations("Stats");
  const parts = [
    {
      key: "solved",
      value: totals.solved,
      className: "bg-data",
      label: t("bankSolved"),
    },
    {
      key: "wrong",
      value: totals.wrong,
      className: "bg-error/60",
      label: t("bankWrong"),
    },
    {
      key: "new",
      value: Math.max(size - totals.solved - totals.wrong, 0),
      className: "bg-untouched",
      label: t("bankNew"),
    },
  ];

  return (
    <Card className="gap-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-lg">{t("bank")}</h2>
        <span className="text-sm text-subtle">
          {t("bankOf", { solved: totals.solved, size })}
        </span>
      </div>
      <StackBar
        parts={parts}
        label={t("bankOf", { solved: totals.solved, size })}
      />
      <ul className="flex flex-wrap gap-4 text-[13px] text-subtle">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-1.5">
            <i className={`size-2 rounded-[2px] ${p.className}`} />
            {p.label}
          </li>
        ))}
      </ul>
    </Card>
  );
}
