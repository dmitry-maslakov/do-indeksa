import "server-only";
import { allAdmissions } from "content-collections";
import { orderBy } from "es-toolkit";

const newestFirst = orderBy(allAdmissions, ["year"], ["desc"]);

const admissionsOf = (faculty: string) =>
  newestFirst.filter((a) => a.faculty === faculty);

export function currentAdmission(faculty: string) {
  const [admission] = admissionsOf(faculty);
  if (!admission) throw new Error(`${faculty} has no admissions`);
  return admission;
}

export const latestResults = (faculty: string) =>
  admissionsOf(faculty).find((a) => a.statistics);
