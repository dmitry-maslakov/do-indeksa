import { cn } from "cn";
import { ArrowUpRightIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

function splitLastWord(children: ReactNode) {
  const parts = [children].flat();
  if (!parts.every((part) => typeof part === "string")) return [children, ""];
  const text = parts.join("");
  const at = text.search(/\S*$/u);
  return [text.slice(0, at), text.slice(at)];
}

export function ExternalLink({
  children,
  iconClassName,
  ...props
}: ComponentProps<"a"> & { iconClassName?: string }) {
  const [head, lastWord] = splitLastWord(children);
  return (
    <a target="_blank" rel="noopener" {...props}>
      {head}
      <span className="whitespace-nowrap">
        {lastWord}
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
