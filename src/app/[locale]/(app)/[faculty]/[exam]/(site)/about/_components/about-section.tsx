import type { ReactNode } from "react";
import type { officialYears } from "@/features/variants/variants";

export type Years = NonNullable<ReturnType<typeof officialYears>>;

interface AboutSectionProps {
  id: string;
  title: string;
  caption?: ReactNode;
  children: ReactNode;
}

export function AboutSection({
  id,
  title,
  caption,
  children,
}: AboutSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="mt-12 lg:mt-16">
      <h2 id={`${id}-h`} className="font-semibold text-[22px] leading-7.5">
        {title}
      </h2>
      {caption && (
        <p className="mt-2 max-w-read text-muted-foreground">{caption}</p>
      )}
      <div className="mt-4 max-w-read">{children}</div>
    </section>
  );
}

export const listClass = "border-t [&>li]:border-b";

export const actionClass =
  "inline-flex min-h-11 items-center font-medium text-[15px] text-data underline-offset-3 hover:underline";

export const noteClass = "mt-3 max-w-[56ch] text-[13px] text-muted-foreground";

export const quietLink =
  "underline decoration-1 underline-offset-2 hover:text-foreground";

export const nowrap = (chunks: ReactNode) => (
  <span className="whitespace-nowrap">{chunks}</span>
);
