"use client";

import { createAuthClient } from "better-auth/client";
import { oneTapClient } from "better-auth/client/plugins";
import { useEffect } from "react";

const prompted = "one-tap-prompted";

export function GoogleOneTap({ clientId }: { clientId: string }) {
  useEffect(() => {
    if (sessionStorage.getItem(prompted)) return;
    sessionStorage.setItem(prompted, "1");
    createAuthClient({ plugins: [oneTapClient({ clientId })] }).oneTap({
      callbackURL: location.pathname + location.search,
    });
  }, [clientId]);
  return null;
}
