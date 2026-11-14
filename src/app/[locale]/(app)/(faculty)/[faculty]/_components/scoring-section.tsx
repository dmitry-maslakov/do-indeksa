import { getTranslations } from "next-intl/server";
import {
  currentAdmission,
  latestResults,
  maxPoints,
} from "@/features/admission/admissions";
import { getBound } from "@/features/admission/figure";
import { SourceLine } from "@/features/admission/source-line";
import { getFacts } from "@/i18n/facts";
import { InfoSection } from "./info-section";

export async function ScoringSection({ faculty }: { faculty: string }) {
  const [t, facts, bound] = await Promise.all([
    getTranslations("Faculty"),
    getFacts(),
    getBound(),
  ]);
  const current = currentAdmission(faculty);
  const { year, scoring, thresholds, tieBreak } = current;
  const results = latestResults(faculty);

  return (
    <InfoSection id="bodovi" title={t("scoringTitle")}>
      <p>
        {t("scoringTotal", {
          max: String(maxPoints(current)),
          schoolMin: String(scoring.school.min),
          schoolMax: String(scoring.school.max),
          examMin: String(scoring.exam.min),
          examMax: String(scoring.exam.max),
        })}
      </p>
      <p>
        {t("thresholds", {
          budget: bound(thresholds.budget),
          self: bound(thresholds.self),
        })}
      </p>
      {tieBreak === "exam" && <p>{t("tieBreak")}</p>}
      {results && (
        <p>{t("cutoffsMeaning", { year: facts.schoolYear(results.year) })}</p>
      )}
      <SourceLine
        faculty={faculty}
        refs={[{ cycle: year, section: scoring.section }]}
      />
    </InfoSection>
  );
}
