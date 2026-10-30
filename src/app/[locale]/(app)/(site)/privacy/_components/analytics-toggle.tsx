"use client";

import { noop } from "es-toolkit";
import { useTranslations } from "next-intl";
import { useOptimisticAction } from "next-safe-action/hooks";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { setAnalytics } from "@/features/account/actions";
import { analyticsConsent, flush } from "@/lib/analytics-browser";

const subscribe = () => noop;

export function AnalyticsToggle() {
  const t = useTranslations("Privacy");
  const consent = useSyncExternalStore(
    subscribe,
    analyticsConsent,
    () => undefined,
  );
  const { execute, optimisticState, isPending } = useOptimisticAction(
    setAnalytics,
    {
      currentState: consent,
      updateFn: (_, { on }) => (on ? "on" : "off"),
    },
  );

  if (!optimisticState) return null;
  if (optimisticState === "gpc")
    return <p className="text-sm text-subtle">{t("analyticsGpc")}</p>;
  const on = optimisticState === "on";
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={async () => {
        await flush();
        execute({ on: !on });
      }}
    >
      {t(on ? "analyticsTurnOff" : "analyticsTurnOn")}
    </Button>
  );
}
