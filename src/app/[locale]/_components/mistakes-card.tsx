import { useTranslations } from "next-intl";
import { EmptyNote } from "@/components/empty-note";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";

interface MistakesCardProps {
  taskIds?: string[];
  signedIn?: boolean;
}

const squares = (
  <span className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <Skeleton key={n} className="size-3 rounded-[3px]" />
    ))}
  </span>
);

export function MistakesCard({ taskIds, signedIn }: MistakesCardProps) {
  const t = useTranslations("Home");

  if (!taskIds) {
    return (
      <Card className="flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-semibold">{t("mistakes")}</span>
          <Skeleton className="h-3 w-40" />
        </div>
        {squares}
      </Card>
    );
  }

  if (!signedIn) {
    return (
      <Card className="gap-3">
        <span className="font-semibold">{t("mistakes")}</span>
        <EmptyNote text={t("mistakesGuest")} signedIn={false} />
      </Card>
    );
  }

  const count = taskIds.length;
  return (
    <Link href="/bank?status=wrong" className="rounded-3xl">
      <Card className="flex-row items-center justify-between gap-4 transition-shadow hover:shadow-raised">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{t("mistakes")}</span>
          <span className="text-sm text-subtle">
            {count > 0 ? t("mistakesCount", { count }) : t("noMistakes")}
          </span>
        </div>
        <span className="flex gap-1">
          {taskIds.slice(0, 5).map((id) => (
            <i
              key={id}
              className="size-3 rounded-[3px] border-2 border-error bg-error-tint"
            />
          ))}
        </span>
      </Card>
    </Link>
  );
}
