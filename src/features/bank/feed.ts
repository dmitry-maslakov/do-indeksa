import "server-only";
import type { Locale } from "next-intl";
import type { Progress, TaskStatus } from "@/features/progress/status";
import type { Level } from "@/features/tasks/level";
import { getTask, type TaskSummary } from "@/features/tasks/tasks";
import { topicName } from "@/features/tasks/topics";
import { bankPage } from "./search";

export interface BankCard {
  id: string;
  topic: string;
  number: number | null;
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
  return {
    id: task.id,
    topic: topicName(task.topic, locale),
    number: task.number,
    level: task.level,
    statement: getTask(task.id)?.text ?? "",
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
