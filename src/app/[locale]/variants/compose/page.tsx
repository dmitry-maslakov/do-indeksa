import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { composeSchema, composeTaskIds } from "@/content/compose";
import { positions } from "@/content/exam";
import { redirect } from "@/i18n/navigation";
import { latestStatuses } from "@/lib/progress";
import { weakest } from "@/lib/stats";
import { getSession } from "@/server/auth";
import { getStatAttempts } from "@/server/history";
import { saveSet } from "@/server/sets";

export default async function ComposePage({
  searchParams,
}: PageProps<"/[locale]/variants/compose">) {
  await connection();
  const { mode, topic } = composeSchema.parse(await searchParams);
  const session = await getSession();
  const attempts = session ? await getStatAttempts(session.user.id) : [];
  const statuses = latestStatuses(attempts);
  const ids = composeTaskIds(
    {
      mode,
      topics: topic,
      weak: weakest(
        attempts,
        positions.map((p) => p.topic),
        new Date(),
      )
        .slice(0, 3)
        .map((w) => String(w.key)),
      solved: new Set(
        [...statuses].filter(([, s]) => s === "solved").map(([id]) => id),
      ),
    },
    crypto.randomUUID(),
  );
  redirect({
    href: `/v/${await saveSet(ids)}`,
    locale: await getLocale(),
  });
}
