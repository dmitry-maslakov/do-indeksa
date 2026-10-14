import { cn } from "cn";
import { StarIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { MathHtml } from "@/components/math-html";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Progress, TaskStatus } from "@/features/progress/status";
import { renderTask, type TaskSummary } from "@/features/tasks/tasks";
import { topicName } from "@/features/tasks/topics";
import { Link } from "@/i18n/navigation";

interface TaskCardProps {
  task: TaskSummary;
  status?: TaskStatus;
  favorite?: boolean;
}

async function TaskCard({
  task,
  status = "new",
  favorite = false,
}: TaskCardProps) {
  const t = await getTranslations("Bank");
  const locale = await getLocale();
  const html = await renderTask(task.id);
  if (!html) return null;

  return (
    <Link
      href={`/bank/${task.id}`}
      className="rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card size="sm" className="transition-shadow hover:shadow-raised">
        <div className="flex items-start justify-between gap-3 text-[13px]">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="tint" className="max-w-full whitespace-normal">
              {topicName(task.topic, locale)}
            </Badge>
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
        <MathHtml html={html.statement} />
      </Card>
    </Link>
  );
}

export const taskCards = (tasks: TaskSummary[], progress?: Progress) =>
  tasks.map((task) => (
    <TaskCard
      key={task.id}
      task={task}
      status={progress?.statuses.get(task.id)}
      favorite={progress?.favorites.has(task.id)}
    />
  ));
