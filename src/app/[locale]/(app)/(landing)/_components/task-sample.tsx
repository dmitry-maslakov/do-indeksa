import { getLocale, getTranslations } from "next-intl/server";
import { MathHtml } from "@/components/math-html";
import { examRecord } from "@/features/catalog/exams";
import { levelOf } from "@/features/catalog/level";
import { examSource } from "@/features/catalog/source";
import { getTask, renderStatement } from "@/features/catalog/tasks";
import { TopicIcon } from "@/features/catalog/topic-icon";
import { topicLook, topicName } from "@/features/catalog/topics";

export async function TaskSample({ sample }: { sample: string }) {
  const { sampleTask } = examRecord(sample);
  const task = sampleTask && getTask(sampleTask);
  if (!task) return null;
  const [t, locale, statement] = await Promise.all([
    getTranslations("Bank"),
    getLocale(),
    renderStatement(task),
  ]);

  return (
    <article className="absolute top-56 right-0 flex w-80 flex-col gap-2.5 rounded-2xl border border-input bg-card px-4 pt-4 pb-4.5 lg:top-54 lg:right-auto lg:left-38 lg:w-105 lg:px-6 lg:pt-4.5 lg:pb-6">
      <span className="inline-flex items-center gap-2 font-semibold text-sm">
        <TopicIcon {...topicLook(task.topic)} size="sm" />
        {topicName(task.topic, locale)}
      </span>
      <span className="flex gap-3 text-sm text-subtle">
        <span>
          {t("sources", {
            source: examSource(task.source) ? "exam" : "ours",
          })}
        </span>
        <span>{t("taskLevel", { level: levelOf(task.difficulty) })}</span>
      </span>
      <MathHtml
        html={statement}
        className="mt-0.5 text-base leading-relaxed lg:text-lg [&_.katex-display]:my-2 [&_p+p]:mt-2"
      />
    </article>
  );
}
