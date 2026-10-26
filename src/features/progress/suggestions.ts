import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { suggestions } from "@/db/schema";
import { db } from "@/server/db";
import type { SuggestionReason } from "./suggestion-reasons";

export async function recordSuggestion(
  profileId: string,
  topic: string,
  reason: SuggestionReason,
) {
  const [row] = await db
    .insert(suggestions)
    .values({ profileId, topic, reason })
    .returning({ id: suggestions.id });
  return row?.id;
}

export async function markSuggestionOpened(profileId: string, id: string) {
  await db
    .update(suggestions)
    .set({ openedAt: sql`now()` })
    .where(
      and(
        eq(suggestions.id, id),
        eq(suggestions.profileId, profileId),
        isNull(suggestions.openedAt),
      ),
    );
}
