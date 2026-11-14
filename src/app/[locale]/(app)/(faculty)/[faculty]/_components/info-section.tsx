import type { ReactNode } from "react";

export function InfoSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`h-${id}`}
      className="scroll-mt-4 [&>p+p]:mt-3"
    >
      <h2 id={`h-${id}`} className="mb-3 font-semibold text-[22px] leading-7.5">
        {title}
      </h2>
      {children}
    </section>
  );
}
