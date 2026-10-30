"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { openSuggestion, showSuggestion } from "@/features/progress/actions";
import type { Suggestion } from "@/features/progress/topic-progress";
import { Link } from "@/i18n/navigation";
import { type BrowserEvents, intentOf } from "@/lib/analytics-browser";
import { useExposure } from "@/lib/use-exposure";

interface SuggestionLinkProps extends Suggestion {
  href: string;
  recommendation?: BrowserEvents["recommendation_made"];
  className: string;
  children: ReactNode;
}

export function SuggestionLink({
  topic,
  reason,
  href,
  recommendation,
  className,
  children,
}: SuggestionLinkProps) {
  const shown = useRef<Promise<string | undefined> | null>(null);
  const seen = useExposure("recommendation_made", recommendation);

  useEffect(() => {
    if (!shown.current)
      shown.current = showSuggestion({ topic, reason }).then((r) => r?.data);
  }, [topic, reason]);

  return (
    <Link
      ref={seen}
      href={href}
      prefetch={false}
      data-intent={intentOf({ via: "picker", placement: "home_hero" })}
      className={className}
      onClick={async () => {
        const id = await shown.current;
        if (id) await openSuggestion({ id });
      }}
    >
      {children}
    </Link>
  );
}
