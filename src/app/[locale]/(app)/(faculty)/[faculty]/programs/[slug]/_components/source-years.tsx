import { Fragment, type ReactNode } from "react";
import { ExternalLink } from "@/components/external-link";
import { mutedSourceLink } from "@/features/admission/source-line";

export const sourceNotes = "mt-3 space-y-1.5 text-[13px] text-muted-foreground";

interface SourceYearsProps {
  intro: (list: () => ReactNode) => ReactNode;
  years: { key: number; label: string; text: string; url: string }[];
}

export function SourceYears({ intro, years }: SourceYearsProps) {
  return (
    <p>
      {intro(() =>
        years.map((y, i) => (
          <Fragment key={y.key}>
            {i > 0 && " · "}
            <ExternalLink
              href={y.url}
              aria-label={y.label}
              className={mutedSourceLink}
            >
              {y.text}
            </ExternalLink>
          </Fragment>
        )),
      )}
    </p>
  );
}
