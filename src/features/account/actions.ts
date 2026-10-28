"use server";

import { refresh } from "next/cache";
import { actionClient } from "@/server/action-client";
import { adoptGuestProfile } from "./adopt";

export const adoptGuest = actionClient.action(async () => {
  const merged = await adoptGuestProfile();
  refresh();
  return merged;
});
