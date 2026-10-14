"use server";

import { z } from "zod";
import { taskCards } from "@/components/task-card";
import { bankPage, filterByStatus, searchBank } from "@/content/bank";
import { loadBankFilters } from "@/lib/bank-params";
import { getSession } from "./auth";
import { getProgress } from "./progress";

export async function loadBankTasks(search: string, offset: number) {
  const session = await getSession();
  const progress = session ? await getProgress(session.user.id) : undefined;
  const filters = loadBankFilters(z.string().parse(search));
  const tasks = filterByStatus(searchBank(filters), filters.status, progress);
  const start = z.number().int().min(0).parse(offset);
  const end = start + bankPage;
  return {
    cards: taskCards(tasks.slice(start, end), progress),
    next: end < tasks.length ? end : null,
  };
}
