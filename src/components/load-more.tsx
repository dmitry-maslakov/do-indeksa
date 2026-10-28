"use client";

import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { useErrorText } from "@/lib/use-error-text";

interface LoadMoreProps {
  feed: Pick<
    UseInfiniteQueryResult,
    | "hasNextPage"
    | "isFetchingNextPage"
    | "isFetchNextPageError"
    | "fetchNextPage"
  >;
  children: ReactNode;
}

export function LoadMore({ feed, children }: LoadMoreProps) {
  const t = useTranslations("Errors");
  const errorText = useErrorText();
  const load = () => feed.fetchNextPage({ cancelRefetch: false });
  const { ref } = useInView({
    rootMargin: "800px",
    onChange: (inView) => inView && load(),
  });

  if (!feed.hasNextPage) return null;

  return (
    <div className="flex flex-col items-center gap-2 self-center">
      {feed.isFetchNextPageError && (
        <p role="alert" className="text-error-text text-sm">
          {errorText()}
        </p>
      )}
      <Button
        ref={ref}
        variant="ghost"
        size="sm"
        disabled={feed.isFetchingNextPage}
        onClick={load}
      >
        {feed.isFetchNextPageError ? t("retry") : children}
      </Button>
    </div>
  );
}
