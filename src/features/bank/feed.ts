import "server-only";
import type { Locale } from "next-intl";
import type { Level } from "@/features/catalog/level";
import { type ExamSource, examSource } from "@/features/catalog/source";
import {
  getTask,
  renderStatement,
  type TaskSummary,
} from "@/features/catalog/tasks";
import type { Tone, TopicIconData } from "@/features/catalog/topic-look";
import { topicLook, topicName } from "@/features/catalog/topics";
import type { Page } from "@/lib/use-feed";

export interface BankCard {
  id: string;
  topic: { id: string; name: string; icon: TopicIconData; tone: Tone };
  exam: ExamSource | null;
  level: Level;
  statement: string;
}

const pageSize = 30;

async function cardOf(task: TaskSummary, locale: Locale): Promise<BankCard> {
  const content = getTask(task.id);
  if (!content) throw new Error(`unknown task ${task.id}`);
  return {
    id: task.id,
    topic: {
      id: task.topic,
      name: topicName(task.topic, locale),
      ...topicLook(task.topic),
    },
    exam: examSource(content.source),
    level: task.level,
    statement: await renderStatement(content),
  };
}

export async function bankPage(
  tasks: TaskSummary[],
  offset: number,
  locale: Locale,
): Promise<Page<BankCard>> {
  const end = offset + pageSize;
  return {
    items: await Promise.all(
      tasks.slice(offset, end).map((task) => cardOf(task, locale)),
    ),
    next: end < tasks.length ? end : null,
  };
}
