"use server";

import { uniq } from "es-toolkit";
import type { Locale } from "next-intl";
import { z } from "zod";
import { maxPlaces } from "@/features/catalog/exams";
import { taskIdSchema } from "@/features/catalog/tasks";
import { topics } from "@/features/catalog/topics";
import { redirect } from "@/i18n/navigation";
import { localeSchema } from "@/lib/page-query";
import { baseClient } from "@/server/action-client";
import { composeModes } from "./custom/compose";
import { composeTaskIds } from "./custom/compose-set";
import { saveSet } from "./custom/sets";
import { inExamOrder } from "./variants";

const topicIds = topics.map((t) => t.id);

async function openSet(
  taskIds: string[],
  locale: Locale,
  query = "",
  type?: "push" | "replace",
) {
  const code = await saveSet(taskIds);
  redirect({ href: `/v/${code}${query}`, locale }, type);
}

export const composeVariant = baseClient
  .inputSchema(
    z.object({
      locale: localeSchema,
      mode: z.enum(composeModes),
      topics: z
        .array(z.string())
        .max(topicIds.length)
        .transform((ids) => topicIds.filter((id) => ids.includes(id))),
      count: z.int().positive().max(maxPlaces).optional(),
    }),
  )
  .action(async ({ parsedInput: { locale, mode, topics, count } }) => {
    const { ids, fallback } = composeTaskIds(
      { mode, topics, size: count },
      crypto.randomUUID(),
    );
    await openSet(ids, locale, fallback ? `?fallback=${mode}` : "");
  });

export const swapTask = baseClient
  .inputSchema(
    z.object({
      locale: localeSchema,
      taskIds: z.array(taskIdSchema).min(1).max(maxPlaces),
    }),
  )
  .action(async ({ parsedInput: { locale, taskIds } }) => {
    await openSet(inExamOrder(uniq(taskIds)), locale, "", "replace");
  });
