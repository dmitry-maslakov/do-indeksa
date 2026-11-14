import "server-only";
import { type Admission, allAdmissions } from "content-collections";
import { orderBy } from "es-toolkit";

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
