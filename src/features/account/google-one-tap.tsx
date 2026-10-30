"use client";

import { createAuthClient } from "better-auth/client";
import { oneTapClient } from "better-auth/client/plugins";
import { useEffect } from "react";
import { type BrowserEvents, flush, queueEvent } from "@/lib/analytics-browser";

const prompted = "one-tap-prompted";

type PromptClosed = BrowserEvents["sign_in_prompt_closed"];

interface PromptMoment {
  getMomentType?: () => PromptClosed["moment"];
  getDismissedReason?: () => PromptClosed["reason"] | null;
}

interface GoogleOneTapProps {
  clientId: string;
  solved: number;
}

export function GoogleOneTap({ clientId, solved }: GoogleOneTapProps) {
  useEffect(() => {
    if (sessionStorage.getItem(prompted)) return;
    sessionStorage.setItem(prompted, "1");
    queueEvent("sign_in_prompt_shown", { from: "one_tap", solved });
    createAuthClient({ plugins: [oneTapClient({ clientId })] }).oneTap({
      callbackURL: location.pathname + location.search,
      onPromptNotification: (moment?: PromptMoment) => {
        const reason = moment?.getDismissedReason?.() ?? undefined;
        if (reason === "credential_returned") return;
        queueEvent("sign_in_prompt_closed", {
          from: "one_tap",
          moment: moment?.getMomentType?.(),
          reason,
        });
      },
      fetchOptions: {
        onRequest: () => {
          flush();
        },
      },
    });
  }, [clientId, solved]);
  return null;
}
