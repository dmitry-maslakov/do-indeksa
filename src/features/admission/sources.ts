import "server-only";
import { allAdmissions } from "content-collections";
import { facultyOf } from "@/features/catalog/faculties";

export type Ref = { cycle: number; section?: string } | { link: string };

export type Source =
  | { kind: "cycle"; year: number; section?: string; url: string }
  | { kind: "link"; title: string; url: string };

function resolveRef(faculty: string, ref: Ref): Source {
  if ("link" in ref) {
    const link = facultyOf(faculty).links[ref.link];
    if (!link) throw new Error(`${faculty} has no link ${ref.link}`);
    return { kind: "link", ...link };
  }
  const admission = allAdmissions.find(
    (a) => a.faculty === faculty && a.year === ref.cycle,
  );
  if (!admission) throw new Error(`${faculty} has no admission ${ref.cycle}`);
  return {
    kind: "cycle",
    year: ref.cycle,
    section: ref.section,
    url: admission.konkurs,
  };
}

export const resolveRefs = (faculty: string, refs: Ref[]) =>
  refs.map((ref) => resolveRef(faculty, ref));
