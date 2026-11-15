import "server-only";
import { allPrograms } from "content-collections";
import { sharedSubjects } from "@/features/admission/content-rules";
import { examRecord } from "@/features/catalog/exams";

const collator = new Intl.Collator("sr-Latn");

const ordered = allPrograms.toSorted((a, b) =>
  collator.compare(a.name, b.name),
);

type ProgramRecord = (typeof ordered)[number];

export type Program = ProgramRecord &
  Required<
    Pick<ProgramRecord, "checked" | "espb" | "degree" | "department" | "choice">
  > & {
    links: Required<Pick<ProgramRecord["links"], "plan">>;
  };

const isChecked = (p: ProgramRecord): p is Program =>
  Boolean(
    p.checked && p.espb && p.degree && p.department && p.choice && p.links.plan,
  );

export const facultyPrograms = (faculty: string) =>
  ordered.filter((p) => p.faculty === faculty);

export const checkedPrograms = ordered.filter(isChecked);

export const getProgram = (faculty: string, slug: string) =>
  checkedPrograms.find((p) => p.faculty === faculty && p.slug === slug);

export const neighbours = (program: Program) =>
  ordered
    .filter(
      (p) =>
        p.faculty === program.faculty &&
        p.exam === program.exam &&
        p.slug !== program.slug,
    )
    .map((p) => ({ ...p, linked: isChecked(p) }));

export const similarPrograms = (program: Program) =>
  program.similar.flatMap(({ program: slug, text }) => {
    const other = facultyPrograms(program.faculty).find((p) => p.slug === slug);
    if (!other) return [];
    return [
      {
        program: other,
        linked: isChecked(other),
        text,
        ...sharedSubjects(program.plan, other.plan),
      },
    ];
  });

export const moduleKindOf = (program: Program) =>
  program.modules.length > 0 ? program.moduleKind : "none";

export const programExam = (program: Program) => examRecord(program.exam);
