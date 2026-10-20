import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { nextTask } from "@/features/bank/queue";
import { idsByTopic } from "@/features/tasks/tasks";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth";

export const instant = false;

export default async function StartPage({
  params,
}: PageProps<"/[locale]/bank/start/[topic]">) {
  const { topic } = await params;
  const first = idsByTopic.get(topic)?.[0];
  if (!first) notFound();
  const session = await getSession();
  const next = await nextTask(topic, session?.user.id);
  redirect({ href: `/bank/${next ?? first}`, locale: await getLocale() });
}
