import "server-only";
import { allTopics } from "content-collections";
import type { Locale } from "next-intl";
import { z } from "zod";

export const topics = allTopics;

export const topicIdSchema = z
  .string()
  .refine((id) => allTopics.some((t) => t.id === id));

export function topicName(id: string, locale: Locale) {
  return allTopics.find((t) => t.id === id)?.name[locale] ?? id;
}

export function topicLook(id: string) {
  const topic = allTopics.find((t) => t.id === id);
  if (!topic) throw new Error(`unknown topic ${id}`);
  return { icon: topic.icon, tone: topic.tone };
}
