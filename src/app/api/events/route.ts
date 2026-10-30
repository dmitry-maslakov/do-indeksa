import { type NextRequest, NextResponse } from "next/server";
import { clientEvents as accountEvents } from "@/features/account/account-events";
import { clientEvents as practiceEvents } from "@/features/practice/practice-events";
import { batchBytes } from "@/lib/analytics-browser";
import { batchParser } from "@/lib/analytics-schema";
import { clientEvents } from "@/lib/site-events";
import { keepAid, trackBatch, visitorOf } from "@/server/analytics";

const parseBatch = batchParser([
  ...clientEvents,
  ...accountEvents,
  ...practiceEvents,
]);

function refusal(headers: Headers) {
  if (!headers.get("content-type")?.startsWith("application/json")) return 415;
  const length = headers.get("content-length");
  if (length === null) return 411;
  if (Number(length) > batchBytes) return 413;
  const origin = URL.parse(headers.get("origin") ?? "");
  if (
    headers.get("sec-fetch-site") === "cross-site" ||
    origin?.host !== headers.get("host")
  )
    return 403;
}

export async function POST(request: NextRequest) {
  const status = refusal(request.headers);
  if (status) return new Response(null, { status });
  const batch = parseBatch(await request.text());
  if (!batch) return new Response(null, { status: 400 });
  const visitor = visitorOf(request.headers, request.cookies);
  trackBatch(visitor, batch);
  const response = new NextResponse(null, { status: 204 });
  keepAid(response, visitor);
  return response;
}
