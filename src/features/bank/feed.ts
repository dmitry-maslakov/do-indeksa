import "server-only";
import type { Locale } from "next-intl";
import type { Level } from "@/features/catalog/level";
import { getTask, type TaskSummary } from "@/features/catalog/tasks";
import type { Tone, TopicIconData } from "@/features/catalog/topic-look";
import { topicLook, topicName } from "@/features/catalog/topics";
import type { TaskStatus, TaskStatuses } from "@/features/progress/status";
import type { Page } from "@/lib/use-feed";
import { type ExamSource, examSource } from "./source";

export interface BankCard {
  id: string;
  topic: { id: string; name: string; icon: TopicIconData; tone: Tone };
  exam: ExamSource | null;
  level: Level;
  statement: string;
  status: TaskStatus;
}

const pageSize = 30;

function cardOf(
  task: TaskSummary,
  locale: Locale,
  statuses?: TaskStatuses,
): BankCard {
  const content = getTask(task.id);
  return {
    id: task.id,
    topic: {
      id: task.topic,
      name: topicName(task.topic, locale),
      ...topicLook(task.topic),
    },
    exam: content ? examSource(content.source) : null,
    level: task.level,
    statement: content?.text ?? "",
    status: statuses?.get(task.id) ?? "new",
  };
}

export function bankPage(
  tasks: TaskSummary[],
  offset: number,
  locale: Locale,
  statuses?: TaskStatuses,
): Page<BankCard> {
  const end = offset + pageSize;
  return {
    items: tasks
      .slice(offset, end)
      .map((task) => cardOf(task, locale, statuses)),
    next: end < tasks.length ? end : null,
  };
}
