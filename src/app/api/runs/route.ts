import type { NextRequest } from "next/server";
import { z } from "zod";
import { runPage } from "@/features/exam/run-feed";
import { routing } from "@/i18n/routing";
import { getSession } from "@/server/auth";

const pageQuery = z.object({
  offset: z.coerce.number().int().min(0),
  locale: z.enum(routing.locales),
});

export async function GET(request: NextRequest) {
  const query = pageQuery.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) return new Response(null, { status: 400 });
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });
  return Response.json(
    await runPage(session.user.id, query.data.offset, query.data.locale),
  );
}
