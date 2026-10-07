import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AnswerForm } from "@/components/answer-form";
import { MathHtml } from "@/components/math-html";
import { Reveal } from "@/components/reveal";
import { TaskRow } from "@/components/task-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTask, siblings, summarize, tasks } from "@/content/tasks";
import { topicName } from "@/content/topics";
import { Link } from "@/i18n/navigation";

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
  const next = rail[(rail.findIndex((s) => s.id === id) + 1) % rail.length];

  return (
    <main className="px-4 pb-9 md:px-9">
      <h1 className="py-6 font-bold text-3xl">{bank("title")}</h1>
      <div className="grid items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
        <Card size="sm" className="order-last gap-3 md:order-none">
          <div className="flex items-center justify-between px-1 text-sm">
            <Link
              href="/bank"
              className="font-semibold text-subtle hover:text-foreground"
            >
              {t("back")}
            </Link>
            <span className="text-subtle">
              {t("inTopic", { count: rail.length })}
            </span>
          </div>
          <nav className="flex flex-col gap-0.5">
            {rail.map((s) => (
              <TaskRow
                key={s.id}
                task={s}
                active={s.id === id}
                meta={bank("meta", { number: s.number, level: s.level })}
              />
            ))}
          </nav>
        </Card>
        <Card className="gap-6 md:p-9">
          <div className="flex flex-wrap items-center gap-2 text-sm text-subtle">
            <Badge variant="tint">{topicName(task.topic, locale)}</Badge>
            <span>
              {bank("meta", { number: summary.number, level: summary.level })} ·{" "}
              {task.source}
            </span>
          </div>
          <MathHtml
            html={task.statement}
            className="font-semibold text-lg tracking-tight md:text-task-lg"
          />
          <AnswerForm
            taskId={task.id}
            labels={task.check.map((c) => c.label)}
          />
          <div className="flex flex-col gap-2">
            {task.hints.map((hint, i) => (
              <Reveal
                key={hint}
                label={t("hint", { number: i + 1 })}
                html={hint}
              />
            ))}
            <Reveal label={t("answer")} html={task.answer} />
            <Reveal label={t("solution")} html={task.solution} />
          </div>
          {next && next.id !== id && (
            <Button
              variant="ghost"
              className="self-end"
              render={<Link href={`/bank/${next.id}`} />}
              nativeButton={false}
            >
              {t("next")}
            </Button>
          )}
        </Card>
      </div>
    </main>
  );
}
