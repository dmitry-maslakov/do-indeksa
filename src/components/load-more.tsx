"use client";

import type { ReactNode } from "react";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";

interface LoadMoreProps {
  pending: boolean;
  onLoad: () => void;
  children: ReactNode;
}

export function LoadMore({ pending, onLoad, children }: LoadMoreProps) {
  const { ref } = useInView({
    rootMargin: "800px",
    onChange: (inView) => inView && onLoad(),
  });

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      className="self-center"
      disabled={pending}
      onClick={onLoad}
    >
      {children}
    </Button>
  );
}
