import { getTranslations } from "next-intl/server";
import { currentAdmission } from "@/features/admission/admissions";
import { facultyPrograms } from "@/features/admission/programs";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";

export async function FacultyFacts({ faculty: id }: { faculty: string }) {
  const [t, facts] = await Promise.all([
    getTranslations("Faculty"),
    getFacts(),
  ]);
  const faculty = facultyOf(id);
  const programs = facultyPrograms(id);
  const academicYears = new Set(
    programs.filter((p) => p.level === "academic").map((p) => p.years),
  );
  const [years] = academicYears;
  const foreign = currentAdmission(id).fees?.foreignTuition;

  return (
    <p className="mt-4 text-[13px] text-muted-foreground lg:max-w-220">
      {foreign && t("foreignTuition", { amount: facts.euro(foreign) })}{" "}
      {academicYears.size === 1 &&
        years &&
        t("levelRule", {
          years,
          applied: programs.some((p) => p.level === "applied") ? "yes" : "no",
        })}{" "}
      {t("university", {
        short: faculty.short,
        university: faculty.universityGenitive,
      })}
    </p>
  );
}
