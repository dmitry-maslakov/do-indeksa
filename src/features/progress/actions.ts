"use server";

import { z } from "zod";
import { knownProfileClient } from "@/server/action-client";
import { track } from "@/server/analytics";
import { suggestionShown } from "./progress-events";
import { markSuggestionOpened, recordSuggestion } from "./suggestions";

export const showSuggestion = knownProfileClient
  .inputSchema(suggestionShown.props.pick({ topic: true, reason: true }))
  .action(async ({ parsedInput: { topic, reason }, ctx: { profileId } }) => {
    const id = profileId
      ? await recordSuggestion(profileId, topic, reason)
      : undefined;
    await track(
      suggestionShown,
      { suggestion_id: id, topic, reason },
      { profileId },
    );
    return id;
  });

export const openSuggestion = knownProfileClient
  .inputSchema(z.object({ id: z.uuid() }))
  .action(async ({ parsedInput: { id }, ctx: { profileId } }) => {
    if (profileId) await markSuggestionOpened(profileId, id);
  });
