import { cn } from "cn";
import type { ComponentProps } from "react";

export function PageTitle({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "pt-4 pb-5 font-bold text-[28px] leading-[1.15] tracking-[-0.02em]",
        className,
      )}
      {...props}
    />
  );
}
