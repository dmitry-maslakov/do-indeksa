"use client";

import { createAuthClient } from "better-auth/client";
import { oneTapClient } from "better-auth/client/plugins";
import { useEffect } from "react";
import { flush } from "@/lib/analytics-browser";

const prompted = "one-tap-prompted";

export function GoogleOneTap({ clientId }: { clientId: string }) {
  useEffect(() => {
    if (sessionStorage.getItem(prompted)) return;
    sessionStorage.setItem(prompted, "1");
    createAuthClient({ plugins: [oneTapClient({ clientId })] }).oneTap({
      callbackURL: location.pathname + location.search,
      fetchOptions: {
        onRequest: () => {
          flush();
        },
      },
    });
  }, [clientId]);
  return null;
}
