import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { getTaskStats } from "@/features/progress/history";
import { weakTopics } from "@/features/progress/progress";
import { composeSchema, composeTaskIds } from "@/features/variants/compose-set";
import { saveSet } from "@/features/variants/sets";
import { redirect } from "@/i18n/navigation";
import { getProfileId } from "@/server/profile";

export const instant = false;

export default async function ComposePage({
  searchParams,
}: PageProps<"/[locale]/variants/compose">) {
  await connection();
  const { mode, topic, count } = composeSchema.parse(await searchParams);
  const needsHistory = mode === "weak" || mode === "unsolved";
  const stats = needsHistory ? await getTaskStats(await getProfileId()) : [];
  const { ids, fallback } = composeTaskIds(
    {
      mode,
      topics: topic,
      weak: weakTopics(stats),
      solved: new Set(stats.filter((s) => s.latestRight).map((s) => s.taskId)),
      size: count,
    },
    crypto.randomUUID(),
  );
  const code = await saveSet(ids);
  redirect({
    href: fallback ? `/v/${code}?fallback=${mode}` : `/v/${code}`,
    locale: await getLocale(),
  });
}
