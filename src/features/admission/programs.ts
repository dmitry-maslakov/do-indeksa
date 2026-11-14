import "server-only";
import { allPrograms } from "content-collections";

const collator = new Intl.Collator("sr-Latn");

const ordered = allPrograms.toSorted((a, b) =>
  collator.compare(a.name, b.name),
);

export const facultyPrograms = (faculty: string) =>
  ordered.filter((p) => p.faculty === faculty);
