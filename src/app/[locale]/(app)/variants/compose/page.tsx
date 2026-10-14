import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { composeSchema, composeTaskIds } from "@/features/exam/compose-set";
import { positions } from "@/features/exam/exam";
import { saveSet } from "@/features/exam/sets";
import { getTaskStats } from "@/features/progress/history";
import { weakest } from "@/features/progress/stats";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth";

export const instant = false;

export default async function ComposePage({
  searchParams,
}: PageProps<"/[locale]/variants/compose">) {
  await connection();
  const { mode, topic } = composeSchema.parse(await searchParams);
  const session = await getSession();
  const stats = session ? await getTaskStats(session.user.id) : [];
  const { ids, fallback } = composeTaskIds(
    {
      mode,
      topics: topic,
      weak: weakest(
        stats,
        positions.map((p) => p.topic),
      )
        .slice(0, 3)
        .map((w) => String(w.key)),
      solved: new Set(stats.filter((s) => s.latestRight).map((s) => s.taskId)),
    },
    crypto.randomUUID(),
  );
  const code = await saveSet(ids);
  redirect({
    href: fallback ? `/v/${code}?fallback=${mode}` : `/v/${code}`,
    locale: await getLocale(),
  });
}
