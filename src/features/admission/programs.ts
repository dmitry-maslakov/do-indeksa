import "server-only";
import { allPrograms } from "content-collections";
import { facultyExams } from "@/features/catalog/exams";

const collator = new Intl.Collator("sr-Latn");

const ordered = allPrograms.toSorted((a, b) =>
  collator.compare(a.name, b.name),
);

export type Program = (typeof ordered)[number];

export const facultyPrograms = (faculty: string) =>
  ordered.filter((p) => p.faculty === faculty);

export const checkedPrograms = ordered.filter((p) => p.checked);

export const getProgram = (faculty: string, slug: string) =>
  checkedPrograms.find((p) => p.faculty === faculty && p.slug === slug);

export const neighbours = (program: Program) =>
  checkedPrograms.filter(
    (p) =>
      p.faculty === program.faculty &&
      p.exam === program.exam &&
      p.slug !== program.slug,
  );

export function programExam(program: Program) {
  const exam = facultyExams(program.faculty).find((e) => e.id === program.exam);
  if (!exam) throw new Error(`exam ${program.exam} is missing`);
  return exam;
}
