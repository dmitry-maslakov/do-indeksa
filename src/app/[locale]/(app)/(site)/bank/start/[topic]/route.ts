import { hasLocale } from "next-intl";
import { nextTasks } from "@/features/bank/queue/queue";
import { idsByTopic } from "@/features/catalog/tasks";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProfileId } from "@/server/profile";

export async function GET(
  _: Request,
  { params }: RouteContext<"/[locale]/bank/start/[topic]">,
) {
  const { locale, topic } = await params;
  const first = idsByTopic.get(topic)?.[0];
  if (!first || !hasLocale(routing.locales, locale)) {
    return new Response(null, { status: 404 });
  }
  const next = (await nextTasks(await getProfileId())).get(topic);
  const href = getPathname({ href: `/bank/${next ?? first}`, locale });
  return new Response(null, { status: 307, headers: { Location: href } });
}
