import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { MathHtml } from "@/components/math-html";
import { PageTitle } from "@/components/page-title";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { positions } from "@/features/exam/exam";
import { AnswerForm } from "@/features/tasks/answer-form";
import { FavoriteButton } from "@/features/tasks/favorite-button";
import { HintsProvider } from "@/features/tasks/hints";
import { taskMeta } from "@/features/tasks/level";
import { ReportTask } from "@/features/tasks/report-task";
import { Reveal } from "@/features/tasks/reveal";
import {
  getTask,
  renderTask,
  siblings,
  summarize,
  tasks,
  taskTitle,
} from "@/features/tasks/tasks";
import { topicName } from "@/features/tasks/topics";
import { alternates } from "@/i18n/alternates";
import { SolveRail } from "./_components/solve-rail";

export const instant = false;

export function generateStaticParams() {
  return tasks.slice(0, 1).map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/bank/[id]">): Promise<Metadata> {
  const task = getTask((await params).id);
  if (!task) return {};
  const meta = await getTranslations("Metadata");
  const locale = await getLocale();
  return {
    title: taskTitle(task, locale, meta),
    description: task.excerpt,
    alternates: alternates(`/bank/${task.id}`, locale),
  };
}

export default async function SolvePage({
  params,
}: PageProps<"/[locale]/bank/[id]">) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) notFound();

  const t = await getTranslations("Solve");
  const bank = await getTranslations("Bank");
  const locale = await getLocale();
  const summary = summarize(task);
  const html = await renderTask(id);
  if (!html) notFound();
  const rail = siblings(task);
  const hintNumbers = task.hints.map((_, i) => i + 1);
  const next = rail[(rail.findIndex((s) => s.id === id) + 1) % rail.length];

  return (
    <main className="px-4 pb-9 md:px-9">
      <PageTitle>{bank("title")}</PageTitle>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:has-data-[rail=collapsed]:grid-cols-[56px_minmax(0,1fr)]">
        <SolveRail
          current={id}
          topic={task.topic}
          rail={rail.map((s) => ({
            id: s.id,
            preview: s.preview,
            meta: taskMeta(s, bank),
          }))}
          topics={positions.flatMap((p) => {
            const first = tasks.find((x) => x.topic === p.topic);
            return first
              ? {
                  id: p.topic,
                  name: topicName(p.topic, locale),
                  first: first.id,
                }
              : [];
          })}
        />
        <HintsProvider>
          <Card className="gap-6 md:p-9">
            <div className="flex items-start justify-between gap-2 text-sm text-subtle">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Badge variant="tint" className="max-w-full whitespace-normal">
                  {topicName(task.topic, locale)}
                </Badge>
                <span>
                  {taskMeta(summary, bank)} · {task.source}
                </span>
              </div>
              <FavoriteButton taskId={task.id} />
            </div>
            <MathHtml
              html={html.statement}
              className="font-semibold text-lg tracking-tight md:text-task-lg"
            />
            <AnswerForm
              taskId={task.id}
              labels={html.labels}
              skip={next && next.id !== id ? `/bank/${next.id}` : undefined}
            />
            <div className="flex flex-col gap-2">
              {hintNumbers.map((n) => (
                <Reveal
                  key={n}
                  label={t("hint", { number: n })}
                  taskId={task.id}
                  part={n - 1}
                />
              ))}
              <Reveal label={t("answer")} taskId={task.id} part="answer" />
              <Reveal label={t("solution")} taskId={task.id} part="solution" />
            </div>
            <ReportTask taskId={task.id} />
          </Card>
        </HintsProvider>
      </div>
    </main>
  );
}
