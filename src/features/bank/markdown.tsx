"use client";

import "katex/dist/katex.min.css";
import { cn } from "cn";
import { memo, useDeferredValue } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Skeleton } from "@/components/ui/skeleton";

const remarkPlugins = [remarkMath];
const rehypePlugins = [rehypeKatex];

interface MarkdownProps {
  source: string;
  className?: string;
}

export const Markdown = memo(function Markdown({
  source,
  className,
}: MarkdownProps) {
  const deferred = useDeferredValue(source, "");

  if (!deferred) {
    return (
      <div className="flex flex-col gap-3 py-1.5">
        <Skeleton className="h-3.5" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
    );
  }

  return (
    <div className={cn("math-text", className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
      >
        {deferred}
      </ReactMarkdown>
    </div>
  );
});
