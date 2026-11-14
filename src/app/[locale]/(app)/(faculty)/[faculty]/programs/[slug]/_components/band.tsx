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
      className="scroll-mt-4 border-t pt-8 pb-9 lg:grid lg:grid-cols-12 lg:gap-x-6 lg:pt-10 lg:pb-11"
    >
      <div className="lg:col-span-3">
        <h2
          id={`h-${name}`}
          className="text-balance font-semibold text-lg in-target:animate-target lg:text-[22px] lg:leading-7.5"
        >
          {title}
        </h2>
        {meta && (
          <div className="mt-1 text-[13px] text-muted-foreground lg:mt-2">
            {meta}
          </div>
        )}
      </div>
      <div
        className={cn(
          "mt-4 lg:col-start-4 lg:mt-0",
          wide ? "lg:col-span-9" : "lg:col-span-8",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}
