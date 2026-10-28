import type { NextRequest } from "next/server";
import { testPage } from "@/features/exam/test-feed";
import { getProfileId } from "@/server/profile";
import { pageQuery } from "../page-query";

export async function GET(request: NextRequest) {
  const query = pageQuery.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) return new Response(null, { status: 400 });
  return Response.json(
    await testPage(await getProfileId(), query.data.offset, query.data.locale),
  );
}
