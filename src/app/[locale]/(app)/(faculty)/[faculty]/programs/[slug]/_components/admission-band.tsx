import { getTranslations } from "next-intl/server";
import type { ProgramYear, ResultYear } from "@/features/admission/admissions";
import type { Program } from "@/features/admission/programs";
import { Band } from "./band";
import { CutoffsTable } from "./cutoffs-table";
import { MoneyFacts } from "./money-facts";

interface AdmissionBandProps {
  program: Program;
  history: ProgramYear[];
  results: ResultYear[];
}

export async function AdmissionBand({
  program,
  history,
  results,
}: AdmissionBandProps) {
  const t = await getTranslations("Program");

  return (
    <Band
      name="upis"
      id="upis"
      title={t("admissionTitle", {
        results: results.length > 0 ? "yes" : "no",
      })}
      className="space-y-10"
    >
      <MoneyFacts program={program} history={history} />
      {results.length > 0 && (
        <CutoffsTable program={program} results={results} />
      )}
    </Band>
  );
}
