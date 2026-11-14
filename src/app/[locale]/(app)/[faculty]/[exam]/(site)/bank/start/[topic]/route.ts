import { hasLocale } from "next-intl";
import { nextTasks } from "@/features/bank/queue/queue";
import { examByParams, inExam } from "@/features/catalog/exams";
import { idsByTopic } from "@/features/catalog/tasks";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProfileId } from "@/server/profile";

export async function GET(
  _: Request,
  { params }: RouteContext<"/[locale]/[faculty]/[exam]/bank/start/[topic]">,
) {
  const { locale, topic, faculty, exam } = await params;
  const examId = examByParams({ faculty, exam });
  const first = idsByTopic.get(topic)?.[0];
  if (!first || !examId || !hasLocale(routing.locales, locale)) {
    return new Response(null, { status: 404 });
  }
  const starts = await nextTasks(await getProfileId(), examId);
  const next = starts.get(topic)?.id;
  const href = getPathname({
    href: inExam(examId, `/bank/${next ?? first}`),
    locale,
  });
  return new Response(null, { status: 307, headers: { Location: href } });
}
