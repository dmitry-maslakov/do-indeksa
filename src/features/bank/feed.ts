import "server-only";
import type { Locale } from "next-intl";
import type { Progress, TaskStatus } from "@/features/progress/status";
import type { Level } from "@/features/tasks/level";
import { getTask, type TaskSummary } from "@/features/tasks/tasks";
import type { Tone, TopicIconData } from "@/features/tasks/topic-look";
import { topicLook, topicName } from "@/features/tasks/topics";
import { bankPage } from "./search";
import { type ExamSource, examSource } from "./source";

export interface BankCard {
  id: string;
  topic: { id: string; name: string; icon: TopicIconData; tone: Tone };
  exam: ExamSource | null;
  level: Level;
  statement: string;
  status: TaskStatus;
  favorite: boolean;
}

export interface FeedPage {
  cards: BankCard[];
  next: number | null;
}

function cardOf(
  task: TaskSummary,
  locale: Locale,
  progress?: Progress,
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
    status: progress?.statuses.get(task.id) ?? "new",
    favorite: progress?.favorites.has(task.id) ?? false,
  };
}

export function feedPage(
  tasks: TaskSummary[],
  offset: number,
  locale: Locale,
  progress?: Progress,
): FeedPage {
  const end = offset + bankPage;
  return {
    cards: tasks
      .slice(offset, end)
      .map((task) => cardOf(task, locale, progress)),
    next: end < tasks.length ? end : null,
  };
}
