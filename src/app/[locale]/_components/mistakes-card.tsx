import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export function MistakesCard({
  taskIds,
  streak,
}: {
  taskIds: string[];
  streak: number;
}) {
  const t = useTranslations("Home");
  const count = taskIds.length;

  return (
    <Link href="/bank?status=wrong" className="rounded-3xl">
      <Card className="flex-row items-center justify-between gap-4 transition-shadow hover:shadow-raised">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{t("mistakes")}</span>
          <span className="text-sm text-subtle">
            {count > 0 ? t("mistakesCount", { count }) : t("noMistakes")}
          </span>
          <span className="text-sm text-subtle">
            {t("streak", { count: streak })}
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
