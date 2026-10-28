import type { NextRequest } from "next/server";
import { feedPage } from "@/features/bank/feed";
import { loadBankFilters } from "@/features/bank/params";
import { findTasks } from "@/features/bank/search";
import { getProgress } from "@/features/progress/progress";
import { getProfileId } from "@/server/profile";
import { pageQuery } from "../page-query";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = pageQuery.safeParse(Object.fromEntries(searchParams));
  if (!query.success) return new Response(null, { status: 400 });
  const filters = loadBankFilters(searchParams);
  const progress = await getProgress(await getProfileId());
  const tasks = findTasks(filters, progress);
  return Response.json(
    feedPage(tasks, query.data.offset, query.data.locale, progress),
  );
}
