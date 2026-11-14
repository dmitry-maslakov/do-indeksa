import type { NextRequest } from "next/server";
import { loadBankFilters } from "@/features/bank/params";
import { loadEarlier } from "@/features/bank/queue/queue";
import { examOf, firstOpenExam } from "@/features/catalog/exams";
import { getProfileId } from "@/server/profile";

export async function GET(request: NextRequest) {
  const { topic } = loadBankFilters(request.nextUrl.searchParams);
  const examId = firstOpenExam();
  if (!topic || !examOf(examId).topics.includes(topic))
    return new Response(null, { status: 400 });
  return Response.json(await loadEarlier(await getProfileId(), examId, topic));
}
