"use server";

import { z } from "zod";
import { knownProfileClient } from "@/server/action-client";
import { markSuggestionOpened } from "./suggestions";

export const openSuggestion = knownProfileClient
  .inputSchema(z.object({ id: z.uuid() }))
  .action(async ({ parsedInput: { id }, ctx: { profileId } }) => {
    if (profileId) await markSuggestionOpened(profileId, id);
  });
