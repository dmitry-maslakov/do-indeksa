"use server";

import { actionClient } from "@/server/action-client";
import { adoptGuestProfile } from "./adopt";

export const adoptGuest = actionClient.action(() => adoptGuestProfile());
