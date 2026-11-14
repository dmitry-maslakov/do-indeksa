import "server-only";
import { allFaculties } from "content-collections";
import { sortBy } from "es-toolkit";

export const faculties = sortBy(allFaculties, ["order"]);

const byId = new Map(faculties.map((f) => [f.id, f]));

export const getFaculty = (id: string) => byId.get(id);

export function facultyOf(id: string) {
  const faculty = getFaculty(id);
  if (!faculty) throw new Error(`faculty ${id} is missing`);
  return faculty;
}
