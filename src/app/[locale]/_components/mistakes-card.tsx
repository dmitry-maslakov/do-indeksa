import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { EmptyNote } from "./empty-note";

interface MistakesCardProps {
  taskIds: string[];
  signedIn: boolean;
}

export function MistakesCard({ taskIds, signedIn }: MistakesCardProps) {
  const t = useTranslations("Home");
  const count = taskIds.length;

  if (!signedIn) {
    return (
      <Card className="gap-3">
        <span className="font-semibold">{t("mistakes")}</span>
        <EmptyNote text={t("mistakesGuest")} signedIn={false} />
      </Card>
    );
  }

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
