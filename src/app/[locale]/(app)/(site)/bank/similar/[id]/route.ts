import { hasLocale } from "next-intl";
import { similarTask } from "@/features/bank/queue/queue";
import { getTask } from "@/features/catalog/tasks";
import { getTopicPlan } from "@/features/progress/progress";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProfileId } from "@/server/profile";

async function targetOf(id: string, topic: string) {
  const profileId = await getProfileId();
  const similar = await similarTask(profileId, id);
  if (similar) return `/bank/${similar}`;
  const { suggestion } = await getTopicPlan(profileId);
  return suggestion && suggestion.topic !== topic
    ? `/bank/start/${suggestion.topic}`
    : "/bank";
}

export async function GET(
  _: Request,
  { params }: RouteContext<"/[locale]/bank/similar/[id]">,
) {
  const { locale, id } = await params;
  const task = getTask(id);
  if (!task || !hasLocale(routing.locales, locale)) {
    return new Response(null, { status: 404 });
  }
  const href = getPathname({ href: await targetOf(id, task.topic), locale });
  return new Response(null, { status: 307, headers: { Location: href } });
}
