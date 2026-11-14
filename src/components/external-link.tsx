import { cn } from "cn";
import { ArrowUpRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

export function ExternalLink({
  children,
  iconClassName,
  ...props
}: ComponentProps<"a"> & { iconClassName?: string }) {
  return (
    <a target="_blank" rel="noopener" {...props}>
      {children}
      <span className="whitespace-nowrap">
        {"⁠"}
        <ArrowUpRightIcon
          aria-hidden
          className={cn(
            "ml-0.5 inline size-3 shrink-0 align-baseline",
            iconClassName,
          )}
        />
      </span>
    </a>
  );
}
