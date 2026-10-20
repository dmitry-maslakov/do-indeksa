import { hasLocale } from "next-intl";
import { nextTask } from "@/features/bank/queue";
import { idsByTopic } from "@/features/tasks/tasks";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProfileId } from "@/server/auth";

export async function GET(
  _: Request,
  { params }: RouteContext<"/[locale]/bank/start/[topic]">,
) {
  const { locale, topic } = await params;
  const first = idsByTopic.get(topic)?.[0];
  if (!first || !hasLocale(routing.locales, locale)) {
    return new Response(null, { status: 404 });
  }
  const next = await nextTask(topic, await getProfileId());
  const href = getPathname({ href: `/bank/${next ?? first}`, locale });
  return new Response(null, { status: 307, headers: { Location: href } });
}
