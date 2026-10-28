import type { NextRequest } from "next/server";
import { testPage } from "@/features/tests/feed";
import { pageQuery } from "@/lib/page-query";
import { getProfileId } from "@/server/profile";

export async function GET(request: NextRequest) {
  const query = pageQuery.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) return new Response(null, { status: 400 });
  return Response.json(
    await testPage(await getProfileId(), query.data.offset, query.data.locale),
  );
}
