"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { useErrorText } from "@/lib/use-error-text";

interface LoadMoreProps {
  pending: boolean;
  failed?: boolean;
  onLoad: () => void;
  children: ReactNode;
}

export function LoadMore({
  pending,
  failed = false,
  onLoad,
  children,
}: LoadMoreProps) {
  const t = useTranslations("Errors");
  const errorText = useErrorText();
  const { ref } = useInView({
    rootMargin: "800px",
    onChange: (inView) => inView && onLoad(),
  });

  return (
    <div className="flex flex-col items-center gap-2 self-center">
      {failed && (
        <p role="alert" className="text-error-text text-sm">
          {errorText()}
        </p>
      )}
      <Button
        ref={ref}
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={onLoad}
      >
        {failed ? t("retry") : children}
      </Button>
    </div>
  );
}
