"use server";

import { actionClient } from "@/server/action-client";
import { adoptGuestProfile } from "@/server/auth";

export const adoptGuest = actionClient.action(() => adoptGuestProfile());
