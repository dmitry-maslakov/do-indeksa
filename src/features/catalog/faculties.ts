import "server-only";
import { allFaculties } from "content-collections";

const faculties = new Map(allFaculties.map((f) => [f.id, f]));

export function getFaculty(id: string) {
  const faculty = faculties.get(id);
  if (!faculty) throw new Error(`faculty ${id} is missing`);
  return faculty;
}
