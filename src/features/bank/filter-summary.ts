import "server-only";
import type { Locale, useTranslations } from "next-intl";
import { topicName } from "@/features/catalog/topics";
import type { BankQuery } from "./search";

export function activeFilters(
  { topic, number, source, level, status }: BankQuery,
  t: ReturnType<typeof useTranslations<"Bank">>,
  locale: Locale,
) {
  return [
    topic && topicName(topic, locale),
    number && t("position", { number }),
    source && t("labelSource", { source }),
    level && t("taskLevel", { level }),
    status && t("labelStatus", { status }),
  ].filter(Boolean);
}

export function filterLabel(
  filters: BankQuery,
  t: ReturnType<typeof useTranslations<"Bank">>,
  locale: Locale,
) {
  const query = filters.q && t("labelQuery", { query: filters.q });
  return (
    [...activeFilters(filters, t, locale), query].filter(Boolean).join(" · ") ||
    t("all")
  );
}
