"use client";

import { useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";

type Render<T> = (value?: T) => ReactNode;

function suspended<T>(useValue: () => T) {
  function Current({ children }: { children: Render<T> }) {
    return children(useValue());
  }
  return function WithValue({ children }: { children: Render<T> }) {
    return (
      <Suspense fallback={children()}>
        <Current>{children}</Current>
      </Suspense>
    );
  };
}

export const WithSearchParams = suspended(useSearchParams);
