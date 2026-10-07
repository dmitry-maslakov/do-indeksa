import { cn } from "cn";
import { StarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { MathHtml } from "@/components/math-html";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { TaskSummary } from "@/content/tasks";
import { topicName } from "@/content/topics";
import { Link } from "@/i18n/navigation";
import type { TaskStatus } from "@/lib/progress";

interface TaskCardProps {
  task: TaskSummary;
  status?: TaskStatus;
  favorite?: boolean;
}

export function TaskCard({
  task,
  status = "new",
  favorite = false,
}: TaskCardProps) {
  const t = useTranslations("Bank");
  const locale = useLocale();

  return (
    <Link
      href={`/bank/${task.id}`}
      className="rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card size="sm" className="transition-shadow hover:shadow-raised">
        <div className="flex items-start justify-between gap-3 text-[13px]">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="tint">{topicName(task.topic, locale)}</Badge>
            <span className="text-subtle">
              {t("meta", { number: task.number, level: task.level })}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {status === "solved" && (
              <Badge variant="success" size="sm">
                {t("solved")}
              </Badge>
            )}
            {status === "wrong" && (
              <Badge variant="error" size="sm">
                {t("wrong")}
              </Badge>
            )}
            <StarIcon
              aria-label={favorite ? t("favorite") : undefined}
              aria-hidden={!favorite}
              className={cn(
                "size-4 text-subtle",
                favorite && "fill-overtime text-overtime",
              )}
            />
          </div>
        </div>
        <MathHtml html={task.statement} />
      </Card>
    </Link>
  );
}
