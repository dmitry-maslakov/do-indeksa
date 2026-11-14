import "server-only";
import { allFaculties } from "content-collections";

const faculties = new Map(allFaculties.map((f) => [f.id, f]));

export const getFaculty = (id: string) => faculties.get(id);
