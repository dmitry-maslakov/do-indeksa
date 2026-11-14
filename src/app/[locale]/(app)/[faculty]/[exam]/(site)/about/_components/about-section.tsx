import type { ReactNode } from "react";

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
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="mt-10 scroll-mt-4 lg:mt-20 lg:grid lg:grid-cols-[--spacing(80)_minmax(0,1fr)] lg:items-start lg:gap-x-20"
    >
      <div className="lg:sticky lg:top-6">
        <h2 id={`${id}-h`} className="font-semibold text-[22px] leading-7.5">
          {title}
        </h2>
        {caption && (
          <p className="mt-2 text-[15px] text-muted-foreground lg:max-w-80">
            {caption}
          </p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export const listClass = "mt-3 border-t lg:mt-0 [&>li]:border-b";

export const actionClass =
  "inline-flex min-h-11 items-center font-medium text-[15px] text-data underline-offset-3 hover:underline";

export const quietLink =
  "underline decoration-1 underline-offset-2 hover:text-foreground";
