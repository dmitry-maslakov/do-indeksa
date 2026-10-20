import type { NextRequest } from "next/server";
import { runPage } from "@/features/exam/run-feed";
import { getProfileId } from "@/server/auth";
import { pageQuery } from "../page-query";

export async function GET(request: NextRequest) {
  const query = pageQuery.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) return new Response(null, { status: 400 });
  return Response.json(
    await runPage(await getProfileId(), query.data.offset, query.data.locale),
  );
}
