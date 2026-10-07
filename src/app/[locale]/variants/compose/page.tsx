import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { statAttempts } from "@/content/attempts";
import { composeSchema, composeTaskIds } from "@/content/compose";
import { positions } from "@/content/exam";
import { redirect } from "@/i18n/navigation";
import { latestStatuses } from "@/lib/progress";
import { weakest } from "@/lib/stats";
import { setId } from "@/lib/variant-id";
import { getSession } from "@/server/auth";
import { getAttempts } from "@/server/history";

export default async function ComposePage({
  searchParams,
}: PageProps<"/[locale]/variants/compose">) {
  await connection();
  const { mode, topic, timer } = composeSchema.parse(await searchParams);
  const session = await getSession();
  const attempts = session
    ? statAttempts(await getAttempts(session.user.id))
    : [];
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
  const query = timer === "off" ? "?timer=off" : "";
  redirect({
    href: `/variants/${setId(ids)}${query}`,
    locale: await getLocale(),
  });
}
