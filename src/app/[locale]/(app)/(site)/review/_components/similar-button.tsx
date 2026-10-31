"use client";

import { ArrowRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useComposeVariant } from "@/features/variants/custom/use-compose-variant";
import { controlOf, intentOf } from "@/lib/analytics-browser";

interface SimilarButtonProps {
  topics: string[];
  className: string;
  children: ReactNode;
}

export function SimilarButton({
  topics,
  className,
  children,
}: SimilarButtonProps) {
  const composeVariant = useComposeVariant();

  return (
    <Button
      variant="lime"
      className={className}
      data-intent={intentOf({ via: "review", placement: "similar" })}
      data-control={controlOf({ control: "practice_similar" })}
      onClick={() => composeVariant({ mode: "topics", topics })}
    >
      {children}
      <ArrowRightIcon />
    </Button>
  );
}
