import { cn } from "cn";
import type { ReactNode } from "react";

interface BandProps {
  name: string;
  id?: string;
  title: string;
  meta?: ReactNode;
  wide?: boolean;
  className?: string;
  children: ReactNode;
}

export function Band({
  name,
  id,
  title,
  meta,
  wide,
  className,
  children,
}: BandProps) {
  return (
    <section
      id={id}
      aria-labelledby={`h-${name}`}
      className="mt-12 scroll-mt-4 lg:mt-16"
    >
      <h2
        id={`h-${name}`}
        className="text-balance font-semibold text-lg in-target:animate-target lg:text-[22px] lg:leading-7.5"
      >
        {title}
      </h2>
      {meta && (
        <div className="mt-1 text-[13px] text-muted-foreground">{meta}</div>
      )}
      <div
        className={cn(
          "mt-4 min-w-0",
          wide && "lg:mx-[calc(50%-(--spacing(100)))]",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}
