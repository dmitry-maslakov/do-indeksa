import { cn } from "cn";
import type * as React from "react";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "animate-shimmer rounded-full bg-untouched bg-[linear-gradient(90deg,transparent_40%,var(--card)_50%,transparent_60%)] bg-size-[200%_100%] motion-reduce:animate-none motion-reduce:bg-none",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
