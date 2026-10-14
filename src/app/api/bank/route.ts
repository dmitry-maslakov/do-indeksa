import type { NextRequest } from "next/server";
import { z } from "zod";
import { feedPage } from "@/features/bank/feed";
import { loadBankFilters } from "@/features/bank/params";
import { filterByStatus, searchBank } from "@/features/bank/search";
import { getProgress } from "@/features/progress/progress";
import { routing } from "@/i18n/routing";
import { getSession } from "@/server/auth";

const pageQuery = z.object({
  offset: z.coerce.number().int().min(0),
  locale: z.enum(routing.locales),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = pageQuery.safeParse(Object.fromEntries(searchParams));
  if (!query.success) return new Response(null, { status: 400 });
  const filters = loadBankFilters(searchParams);
  const session = await getSession();
  const progress = session ? await getProgress(session.user.id) : undefined;
  const tasks = filterByStatus(searchBank(filters), filters.status, progress);
  return Response.json(
    await feedPage(tasks, query.data.offset, query.data.locale, progress),
  );
}
