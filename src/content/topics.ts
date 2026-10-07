import "server-only";
import { allTopics } from "content-collections";
import type { Locale } from "next-intl";

export const topics = allTopics;

export function topicName(id: string, locale: Locale) {
  return allTopics.find((t) => t.id === id)?.name[locale] ?? id;
}
