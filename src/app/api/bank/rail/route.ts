import type { NextRequest } from "next/server";
import { z } from "zod";
import { loadBankFilters } from "@/features/bank/params";
import { listPage } from "@/features/bank/rail-task";
import { getProgress } from "@/features/progress/progress";
import { getSession } from "@/server/auth";

const railQuery = z.object({
  offset: z.coerce.number().int().min(0).optional(),
  around: z.string().max(100).optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = railQuery.safeParse({
    offset: searchParams.get("offset") ?? undefined,
    around: searchParams.get("around") ?? undefined,
  });
  if (!query.success) return new Response(null, { status: 400 });
  const filters = loadBankFilters(searchParams);
  const session = await getSession();
  const progress = session ? await getProgress(session.user.id) : undefined;
  return Response.json(listPage(filters, progress, query.data));
}
