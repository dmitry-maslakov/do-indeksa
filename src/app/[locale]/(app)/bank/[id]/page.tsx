import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FocusMode } from "@/components/focus-mode";
import { MathHtml } from "@/components/math-html";
import { RailPanel } from "@/components/rail";
import { serializeBankFilters } from "@/features/bank/params";
import { loadQueue } from "@/features/bank/queue/queue";
import { examSource } from "@/features/bank/source";
import { positions } from "@/features/catalog/exams";
import { levelOf } from "@/features/catalog/level";
import {
  getTask,
  renderTask,
  tasks,
  taskTitle,
} from "@/features/catalog/tasks";
import { topicLook, topicName } from "@/features/catalog/topics";
import { AnswerForm } from "@/features/practice/answer/answer-form";
import { FavoriteButton } from "@/features/practice/favorite-button";
import { FavoriteToggle } from "@/features/practice/favorite-toggle";
import { ReportTask } from "@/features/practice/report-task";
import { HelpPanel } from "@/features/practice/reveal/help-panel";
import { TaskSessionProvider } from "@/features/practice/session/task-session";
import { alternates } from "@/i18n/alternates";
import { getProfileId } from "@/server/profile";
import { PhoneBar } from "./_components/phone-bar";
import { Rail } from "./_components/rail";
import { TaskMeta } from "./_components/task-meta";

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

  const [profileId, locale, html, bank] = await Promise.all([
    getProfileId(),
    getLocale(),
    renderTask(id),
    getTranslations("Bank"),
  ]);
  if (!html) notFound();

  const queue = await loadQueue({
    topic: task.topic,
    profileId,
    current: id,
    locale,
  });
  const topic = topicName(task.topic, locale);
  const rail = {
    current: id,
    topic: task.topic,
    topics: positions.map((p) => ({
      id: p.topic,
      name: topicName(p.topic, locale),
    })),
    listQuery: serializeBankFilters({ topic: task.topic }),
    queue,
  };

  return (
    <main className="px-4 pb-28 md:px-10 md:pt-2 md:pb-15">
      <FocusMode mode="task" />
      <h1 className="sr-only">{bank("title")}</h1>
      <PhoneBar key={id} title={topic} look={topicLook(task.topic)} {...rail} />
      <div className="flex items-start gap-14">
        <RailPanel label={bank("all")}>
          <Rail {...rail} />
        </RailPanel>
        <TaskSessionProvider key={id} taskId={id}>
          <article className="flex min-w-0 max-w-task flex-1 flex-col pt-1">
            <div className="flex min-h-10 items-start justify-between gap-4 md:items-center">
              <TaskMeta
                topic={topic}
                exam={examSource(task.source)}
                level={levelOf(task.difficulty)}
                before={queue.before}
              />
              <Suspense fallback={<FavoriteButton taskId={id} pending />}>
                <FavoriteToggle taskId={id} />
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
              next={queue.next && `/bank/${queue.next}`}
              fallback="/bank"
            />
            <HelpPanel taskId={id} hintCount={html.hints.length} />
            <div className="mt-6">
              <ReportTask taskId={id} />
            </div>
          </article>
        </TaskSessionProvider>
      </div>
    </main>
  );
}
