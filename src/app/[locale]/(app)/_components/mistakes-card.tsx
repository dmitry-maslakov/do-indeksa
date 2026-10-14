import { range } from "es-toolkit";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";

interface MistakesCardProps {
  count?: number;
}

const maxSquares = 5;

const squares = (
  <span className="flex gap-1">
    {range(maxSquares).map((n) => (
      <Skeleton key={n} className="size-3 rounded-[3px]" />
    ))}
  </span>
);

export function MistakesCard({ count }: MistakesCardProps) {
  const t = useTranslations("Home");

  if (count === undefined) {
    return (
      <Card className="flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-semibold">{t("mistakesTitle")}</span>
          <Skeleton className="h-3 w-40" />
        </div>
        {squares}
      </Card>
    );
  }

  if (count === 0) {
    return (
      <Card className="flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{t("mistakesTitle")}</span>
          <span className="text-sm text-subtle">{t("noMistakes")}</span>
        </div>
      </Card>
    );
  }

  return (
    <Link href="/bank?status=wrong" className="rounded-3xl">
      <Card className="flex-row items-center justify-between gap-4 transition-shadow hover:shadow-raised">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{t("mistakes")}</span>
          <span className="text-sm text-subtle">
            {t("mistakesCount", { count })}
          </span>
        </div>
        <span className="flex gap-1">
          {range(Math.min(count, maxSquares)).map((n) => (
            <i
              key={n}
              className="size-3 rounded-[3px] border-2 border-error bg-error-tint"
            />
          ))}
        </span>
      </Card>
    </Link>
  );
}
