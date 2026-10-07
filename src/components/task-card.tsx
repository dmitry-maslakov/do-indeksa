import { useLocale, useTranslations } from "next-intl";
import { MathHtml } from "@/components/math-html";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { type TaskSummary, topicName } from "@/server/tasks";

export function TaskCard({ task }: { task: TaskSummary }) {
  const t = useTranslations("Bank");
  const locale = useLocale();

  return (
    <Link
      href={`/bank/${task.id}`}
      className="rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card size="sm" className="transition-shadow hover:shadow-raised">
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <Badge variant="tint">{topicName(task.topic, locale)}</Badge>
          <span className="text-subtle">
            {t("meta", { number: task.number, level: task.level })}
          </span>
        </div>
        <MathHtml html={task.statement} />
      </Card>
    </Link>
  );
}
