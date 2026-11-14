import { ArrowUpRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

export function ExternalLink({ children, ...props }: ComponentProps<"a">) {
  return (
    <a target="_blank" rel="noopener" {...props}>
      {children}
      <ArrowUpRightIcon
        aria-hidden
        className="ml-0.5 inline size-3 shrink-0 align-baseline"
      />
    </a>
  );
}
