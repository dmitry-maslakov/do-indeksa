"use server";

import { uniq } from "es-toolkit";
import type { Locale } from "next-intl";
import { z } from "zod";
import { examPathSchema, inExam, maxPlaces } from "@/features/catalog/exams";
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
  { examId, locale }: { examId: string; locale: Locale },
  taskIds: string[],
  query = "",
  type?: "push" | "replace",
) {
  const code = await saveSet(taskIds);
  redirect({ href: inExam(examId, `/v/${code}${query}`), locale }, type);
}

export const composeVariant = baseClient
  .inputSchema(
    z.object({
      locale: localeSchema,
      exam: examPathSchema,
      mode: z.enum(composeModes),
      topics: z
        .array(z.string())
        .max(topicIds.length)
        .transform((ids) => topicIds.filter((id) => ids.includes(id))),
      count: z.int().positive().max(maxPlaces).optional(),
    }),
  )
  .action(async ({ parsedInput: { locale, exam, mode, topics, count } }) => {
    const { ids, fallback } = composeTaskIds(
      exam,
      { mode, topics, size: count },
      crypto.randomUUID(),
    );
    await openSet(
      { examId: exam, locale },
      ids,
      fallback ? `?fallback=${mode}` : "",
    );
  });

export const swapTask = baseClient
  .inputSchema(
    z.object({
      locale: localeSchema,
      exam: examPathSchema,
      taskIds: z.array(taskIdSchema).min(1).max(maxPlaces),
    }),
  )
  .action(async ({ parsedInput: { locale, exam, taskIds } }) => {
    await openSet(
      { examId: exam, locale },
      inExamOrder(exam, uniq(taskIds)),
      "",
      "replace",
    );
  });
