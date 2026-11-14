import { getFormatter, getTranslations } from "next-intl/server";
import {
  currentAdmission,
  latestResults,
} from "@/features/admission/admissions";
import { SourceLine } from "@/features/admission/source-line";
import { getFacts } from "@/i18n/facts";
import { InfoSection } from "./info-section";

export async function ScoringSection({ faculty }: { faculty: string }) {
  const [t, facts, format] = await Promise.all([
    getTranslations("Faculty"),
    getFacts(),
    getFormatter(),
  ]);
  const { year, scoring, thresholds, tieBreak } = currentAdmission(faculty);
  const results = latestResults(faculty);
  const bound = (b: { over: number } | { atLeast: number }) =>
    "over" in b
      ? t("bound", { kind: "over", points: format.number(b.over) })
      : t("bound", { kind: "atLeast", points: format.number(b.atLeast) });

  return (
    <InfoSection id="bodovi" title={t("scoringTitle")}>
      <p>
        {t("scoringTotal", {
          max: String(scoring.school.max + scoring.exam.max),
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
