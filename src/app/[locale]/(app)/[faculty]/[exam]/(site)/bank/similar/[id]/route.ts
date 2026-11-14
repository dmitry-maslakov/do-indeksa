import { hasLocale } from "next-intl";
import { similarTask } from "@/features/bank/queue/queue";
import { examByParams, inExam } from "@/features/catalog/exams";
import { getTask } from "@/features/catalog/tasks";
import { getTopicPlan } from "@/features/progress/progress";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProfileId } from "@/server/profile";

async function targetOf(examId: string, id: string, topic: string) {
  const profileId = await getProfileId();
  const similar = await similarTask(profileId, examId, id);
  if (similar) return `/bank/${similar}`;
  const { suggestion } = await getTopicPlan(profileId, examId);
  return suggestion && suggestion.topic !== topic
    ? `/bank/start/${suggestion.topic}`
    : "/bank";
}

export async function GET(
  _: Request,
  { params }: RouteContext<"/[locale]/[faculty]/[exam]/bank/similar/[id]">,
) {
  const { locale, id, faculty, exam } = await params;
  const examId = examByParams({ faculty, exam });
  const task = getTask(id);
  if (!task || !examId || !hasLocale(routing.locales, locale)) {
    return new Response(null, { status: 404 });
  }
  const href = getPathname({
    href: inExam(examId, await targetOf(examId, id, task.topic)),
    locale,
  });
  return new Response(null, { status: 307, headers: { Location: href } });
}
