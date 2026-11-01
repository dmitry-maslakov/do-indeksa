import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { MathHtml } from "@/components/math-html";
import { TaskSignInStrip } from "@/features/account/sign-in-strip";
import { bankHref } from "@/features/bank/params";
import { positions } from "@/features/catalog/exams";
import { levelOf } from "@/features/catalog/level";
import { examSource } from "@/features/catalog/source";
import {
  getTask,
  renderTask,
  tasks,
  taskTitle,
} from "@/features/catalog/tasks";
import { topicLook, topicName } from "@/features/catalog/topics";
import { AnswerForm } from "@/features/practice/answer/answer-form";
import { ReportTask } from "@/features/practice/report-task";
import { HelpPanel } from "@/features/practice/reveal/help-panel";
import { SittingFeed } from "@/features/practice/session/sitting-feed";
import { TaskSessionProvider } from "@/features/practice/session/task-session";
import { alternates } from "@/i18n/alternates";
import { routing } from "@/i18n/routing";
import { QueueFeed } from "../_components/queue-store";
import { firstTasks } from "./_components/first-tasks";
import { loadPersonal } from "./_components/personal";
import { PhoneBar } from "./_components/phone-bar";
import { TaskMeta } from "./_components/task-meta";

export function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  const shells =
    params.locale === routing.defaultLocale ? firstTasks() : tasks.slice(0, 1);
  return shells.map((t) => ({ id: t.id }));
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

  const [locale, html] = await Promise.all([getLocale(), renderTask(id)]);
  if (!html) notFound();
  const personal = loadPersonal({ id, topic: task.topic, locale });
  const topic = topicName(task.topic, locale);
  const meta = {
    id,
    topic,
    exam: examSource(task.source),
    level: levelOf(task.difficulty),
  };
  const feed = {
    topic: task.topic,
    topics: positions.map((p) => ({
      id: p.topic,
      name: topicName(p.topic, locale),
    })),
    listHref: bankHref({ topic: task.topic }),
    queue: personal.then((p) => p.queue),
    starts: personal.then((p) => p.starts),
  };

  return (
    <TaskSessionProvider key={id} taskId={id}>
      <QueueFeed {...feed} />
      <Suspense>
        <SittingFeed sitting={personal.then((p) => p.sitting)} />
      </Suspense>
      <PhoneBar
        title={topic}
        listHref={feed.listHref}
        look={topicLook(task.topic)}
      />
      <article className="flex min-w-0 max-w-task flex-1 flex-col pt-1">
        <div className="flex min-h-10 items-start md:items-center">
          <Suspense fallback={<TaskMeta {...meta} />}>
            <TaskMeta {...meta} before={personal.then((p) => p.queue.before)} />
          </Suspense>
        </div>
        <MathHtml
          html={html.statement}
          className="mt-3 overflow-x-auto text-task md:mt-6 md:text-task-lg [&_strong]:font-semibold"
        />
        <AnswerForm
          taskId={id}
          parts={html.parts}
          unchecked={html.unchecked}
          answerText={html.answerText}
          next={personal.then((p) => p.next)}
          fallback="/bank"
          afterCorrect={
            <Suspense>
              <TaskSignInStrip solved={personal.then((p) => p.solved)} />
            </Suspense>
          }
        />
        <HelpPanel
          taskId={id}
          hintCount={html.hints.length}
          answerText={html.answerText}
        />
        <div className="mt-6">
          <ReportTask taskId={id} />
        </div>
      </article>
    </TaskSessionProvider>
  );
}
