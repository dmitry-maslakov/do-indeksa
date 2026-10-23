import { cn } from "cn";
import type { ComponentProps } from "react";

export function PageTitle({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn("font-bold text-2xl tracking-tight md:text-3xl", className)}
      {...props}
    />
  );
}
