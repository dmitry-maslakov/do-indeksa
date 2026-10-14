import "server-only";
import type { Locale } from "next-intl";
import type { Progress, TaskStatus } from "@/features/progress/status";
import type { Level } from "@/features/tasks/level";
import { renderTask, type TaskSummary } from "@/features/tasks/tasks";
import { topicName } from "@/features/tasks/topics";
import { bankPage } from "./search";

export interface BankCard {
  id: string;
  topic: string;
  number: number;
  level: Level;
  statement: string;
  status: TaskStatus;
  favorite: boolean;
}

export interface FeedPage {
  cards: BankCard[];
  next: number | null;
}

async function cardOf(
  task: TaskSummary,
  locale: Locale,
  progress?: Progress,
): Promise<BankCard> {
  const html = await renderTask(task.id);
  return {
    id: task.id,
    topic: topicName(task.topic, locale),
    number: task.number,
    level: task.level,
    statement: html?.statement ?? "",
    status: progress?.statuses.get(task.id) ?? "new",
    favorite: progress?.favorites.has(task.id) ?? false,
  };
}

export async function feedPage(
  tasks: TaskSummary[],
  offset: number,
  locale: Locale,
  progress?: Progress,
): Promise<FeedPage> {
  const end = offset + bankPage;
  return {
    cards: await Promise.all(
      tasks.slice(offset, end).map((task) => cardOf(task, locale, progress)),
    ),
    next: end < tasks.length ? end : null,
  };
}
