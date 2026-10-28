import type { NextRequest } from "next/server";
import { bankPage } from "@/features/bank/feed";
import { loadBankFilters } from "@/features/bank/params";
import { findTasks } from "@/features/bank/search";
import { getTaskStatuses } from "@/features/progress/progress";
import { pageQuery } from "@/lib/page-query";
import { getProfileId } from "@/server/profile";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = pageQuery.safeParse(Object.fromEntries(searchParams));
  if (!query.success) return new Response(null, { status: 400 });
  const filters = loadBankFilters(searchParams);
  const statuses = await getTaskStatuses(await getProfileId());
  const tasks = findTasks(filters, statuses);
  return Response.json(
    bankPage(tasks, query.data.offset, query.data.locale, statuses),
  );
}
