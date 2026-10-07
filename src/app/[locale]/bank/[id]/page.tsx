import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AnswerForm } from "@/components/answer-form";
import { FavoriteButton } from "@/components/favorite-button";
import { HintsProvider } from "@/components/hints";
import { MathHtml } from "@/components/math-html";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { positions } from "@/content/exam";
import { getTask, siblings, summarize, tasks } from "@/content/tasks";
import { topicName } from "@/content/topics";
import { SolveRail } from "./_components/solve-rail";

export const dynamicParams = false;

export function generateStaticParams() {
  return tasks.map((t) => ({ id: t.id }));
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
  const rail = siblings(task);
  const hintNumbers = task.hints.map((_, i) => i + 1);
  const next = rail[(rail.findIndex((s) => s.id === id) + 1) % rail.length];

  return (
    <main className="px-4 pb-9 md:px-9">
      <h1 className="py-6 font-bold text-3xl">{bank("title")}</h1>
      <div className="grid items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:has-data-[rail=collapsed]:grid-cols-[56px_minmax(0,1fr)]">
        <SolveRail
          current={id}
          topic={task.topic}
          rail={rail.map((s) => ({
            ...s,
            meta: bank("meta", { number: s.number, level: s.level }),
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
                <Badge variant="tint">{topicName(task.topic, locale)}</Badge>
                <span>
                  {bank("meta", {
                    number: summary.number,
                    level: summary.level,
                  })}{" "}
                  · {task.source}
                </span>
              </div>
              <FavoriteButton taskId={task.id} />
            </div>
            <MathHtml
              html={task.statement}
              className="font-semibold text-lg tracking-tight md:text-task-lg"
            />
            <AnswerForm
              taskId={task.id}
              labels={task.check.map((c) => c.label)}
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
          </Card>
        </HintsProvider>
      </div>
    </main>
  );
}
