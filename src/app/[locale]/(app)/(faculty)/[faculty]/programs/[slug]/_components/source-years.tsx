import { Fragment, type ReactNode } from "react";
import { ExternalLink } from "@/components/external-link";
import { sourceLink } from "@/features/admission/source-line";

const link = `${sourceLink} hover:text-foreground`;

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
            <ExternalLink href={y.url} aria-label={y.label} className={link}>
              {y.text}
            </ExternalLink>
          </Fragment>
        )),
      )}
    </p>
  );
}
