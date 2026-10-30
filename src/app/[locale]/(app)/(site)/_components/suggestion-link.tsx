"use client";

import { noop } from "es-toolkit";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { openSuggestion, showSuggestion } from "@/features/progress/actions";
import type { Suggestion } from "@/features/progress/topic-progress";
import { Link } from "@/i18n/navigation";
import {
  type BrowserEvents,
  intentOf,
  queueEvent,
} from "@/lib/analytics-browser";
import { useExposure, viewKey } from "@/lib/use-exposure";

interface SuggestionLinkProps extends Suggestion {
  href: string;
  recommendation?: BrowserEvents["recommendation_made"];
  className: string;
  children: ReactNode;
}

interface Shown {
  at: number;
  id?: string;
  opened?: boolean;
}

const shownSuggestions = new Map<string, Shown>();

export function SuggestionLink({
  topic,
  reason,
  href,
  recommendation,
  className,
  children,
}: SuggestionLinkProps) {
  const { bfcacheId } = useRouter();
  const seen = useExposure("recommendation_made", recommendation);

  useEffect(() => {
    const key = viewKey(bfcacheId, `${topic} ${reason}`);
    if (shownSuggestions.has(key)) return;
    const current: Shown = { at: performance.now() };
    shownSuggestions.set(key, current);
    showSuggestion({ topic, reason }).then((r) => {
      current.id = r?.data;
    }, noop);
  }, [bfcacheId, topic, reason]);

  return (
    <Link
      ref={seen}
      href={href}
      prefetch={false}
      data-intent={intentOf({ via: "picker", placement: "home_hero" })}
      className={className}
      onClick={() => {
        const current = shownSuggestions.get(
          viewKey(bfcacheId, `${topic} ${reason}`),
        );
        if (!current || current.opened) return;
        current.opened = true;
        queueEvent("suggestion_opened", {
          suggestion_id: current.id,
          topic,
          reason,
          since_shown_ms: Math.round(performance.now() - current.at),
        });
        if (current.id) openSuggestion({ id: current.id }).catch(noop);
      }}
    >
      {children}
    </Link>
  );
}
