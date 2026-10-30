"use client";

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { queueEvent } from "@/lib/analytics-browser";

function failureOf({ cause }: Error) {
  if (typeof cause === "number")
    return { reason: cause < 500 ? "http" : "server", status: cause } as const;
  return { reason: navigator.onLine ? "network" : "offline" } as const;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, { queryKey: [key] }) =>
            queueEvent("request_failed", {
              kind: key === "reveal" ? "reveal" : "feed",
              ...failureOf(error),
            }),
        }),
        defaultOptions: { queries: { retry: 1, networkMode: "always" } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
