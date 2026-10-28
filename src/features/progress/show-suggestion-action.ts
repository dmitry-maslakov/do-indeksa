"use server";

import { z } from "zod";
import { suggestionReasons } from "@/db/columns";
import { idsByTopic } from "@/features/tasks/tasks";
import { knownProfileClient } from "@/server/action-client";
import { recordSuggestion } from "./suggestions";

export const showSuggestion = knownProfileClient
  .inputSchema(
    z.object({
      topic: z.string().refine((topic) => idsByTopic.has(topic)),
      reason: z.enum(suggestionReasons),
    }),
  )
  .action(async ({ parsedInput: { topic, reason }, ctx: { profileId } }) =>
    profileId ? recordSuggestion(profileId, topic, reason) : undefined,
  );
