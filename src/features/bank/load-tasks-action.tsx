"use server";

import { z } from "zod";
import { getSession } from "@/server/auth";
import { getProgress } from "@/server/progress";
import { loadBankFilters } from "./params";
import { bankPage, filterByStatus, searchBank } from "./search";
import { taskCards } from "./task-card";

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
