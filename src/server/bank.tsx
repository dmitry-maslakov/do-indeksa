"use server";

import { z } from "zod";
import { taskCards } from "@/components/task-card";
import { bankFiltersSchema, bankPage, searchBank } from "@/content/bank";
import { getSession } from "./auth";
import { getProgress } from "./progress";

export async function loadBankTasks(filters: unknown, offset: number) {
  const session = await getSession();
  const progress = session ? await getProgress(session.user.id) : undefined;
  const tasks = searchBank(bankFiltersSchema.parse(filters), progress);
  const start = z.number().int().min(0).parse(offset);
  const end = start + bankPage;
  return {
    cards: taskCards(tasks.slice(start, end), progress),
    next: end < tasks.length ? end : null,
  };
}
