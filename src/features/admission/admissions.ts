import "server-only";
import { type Admission, allAdmissions } from "content-collections";
import { isEqual, orderBy } from "es-toolkit";

const newestFirst = orderBy(allAdmissions, ["year"], ["desc"]);

const admissionsOf = (faculty: string) =>
  newestFirst.filter((a) => a.faculty === faculty);

export function currentAdmission(faculty: string) {
  const [admission] = admissionsOf(faculty);
  if (!admission) throw new Error(`${faculty} has no admissions`);
  return admission;
}

export const maxPoints = ({ scoring }: Admission) =>
  scoring.school.max + scoring.exam.max;

export const latestResults = (faculty: string) =>
  admissionsOf(faculty).find((a) => a.statistics);

export interface Run<T> {
  value: T;
  years: number[];
}

export function runs<T>(rows: { year: number; value: T }[]) {
  const grouped: Run<T>[] = [];
  for (const { year, value } of rows) {
    const last = grouped.at(-1);
    if (last && isEqual(last.value, value)) last.years.push(year);
    else grouped.push({ value, years: [year] });
  }
  return grouped;
}

export const programHistory = (faculty: string, slug: string) =>
  admissionsOf(faculty).flatMap(({ programs, ...admission }) => {
    const row = programs[slug];
    return row ? [{ ...admission, ...row }] : [];
  });

export type ProgramYear = ReturnType<typeof programHistory>[number];

export const ruleGroups = (faculty: string) =>
  runs(
    admissionsOf(faculty).map((a) => ({
      year: a.year,
      value: a.thresholds,
    })),
  );

export const resultYears = (history: ProgramYear[]) =>
  history.flatMap(({ statistics, cutoff, ...year }) =>
    statistics && cutoff ? [{ ...year, statistics, cutoff }] : [],
  );

export type ResultYear = ReturnType<typeof resultYears>[number];
