"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { openSuggestion, showSuggestion } from "@/features/progress/actions";
import type { Suggestion } from "@/features/progress/topic-progress";
import { Link } from "@/i18n/navigation";

export function SuggestionLink({
  topic,
  reason,
  className,
  children,
}: Suggestion & { className: string; children: ReactNode }) {
  const shown = useRef<Promise<string | undefined> | null>(null);

  useEffect(() => {
    shown.current ??= showSuggestion({ topic, reason }).then((r) => r?.data);
  }, [topic, reason]);

  return (
    <Link
      href={`/bank/start/${topic}`}
      prefetch={false}
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
