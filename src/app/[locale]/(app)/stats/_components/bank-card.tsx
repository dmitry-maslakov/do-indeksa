import { useTranslations } from "next-intl";
import { StackBar } from "@/components/stack-bar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { totals } from "@/lib/stats";

interface BankCardProps {
  totals?: ReturnType<typeof totals>;
  size: number;
}

export function BankCard({ totals, size }: BankCardProps) {
  const t = useTranslations("Stats");
  const solved = totals?.solved ?? 0;
  const wrong = totals?.wrong ?? 0;
  const parts = [
    {
      key: "solved",
      value: solved,
      className: "bg-data",
      label: t("bankSolved"),
    },
    {
      key: "wrong",
      value: wrong,
      className: "bg-error/60",
      label: t("bankWrong"),
    },
    {
      key: "new",
      value: Math.max(size - solved - wrong, 0),
      className: "bg-untouched",
      label: t("bankNew"),
    },
  ];

  return (
    <Card className="gap-3.5">
      <CardHeader>
        <CardTitle>{t("bank")}</CardTitle>
        {totals ? (
          <CardDescription>{t("bankOf", { solved, size })}</CardDescription>
        ) : (
          <Skeleton className="h-3 w-14" />
        )}
      </CardHeader>
      {totals ? (
        <StackBar parts={parts} label={t("bankOf", { solved, size })} />
      ) : (
        <Skeleton className="h-3.5" />
      )}
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
