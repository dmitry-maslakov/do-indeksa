import { routing } from "@/i18n/routing";
import { legacyPages } from "@/lib/legacy-addresses";

export type Ref = { cycle: number; section?: string } | { link: string };

const reserved = new Set<string>([
  ...routing.locales,
  ...["privacy", "terms", "api", "sitemap", "robots", "404", "opengraph-image"],
  ...legacyPages.flatMap(({ source }) =>
    (source.split("/")[1] ?? "").replace(/[()]/g, "").split("|"),
  ),
]);

const examPages = ["programs", "about"];

export function facultyProblem(
  id: string,
  { programs, openExams }: { programs: number; openExams: number },
) {
  if (!/^[a-z]+$/.test(id)) return "a faculty id is lower-case letters";
  if (reserved.has(id)) return `"${id}" is a reserved address`;
  if (programs === 0) return "the faculty has no programmes";
  if (openExams === 0)
    return "no exam is open; set open: true in one exams/<faculty>-<segment>.yaml";
}

export interface ExamRecord {
  id: string;
  faculty: string;
  segment: string;
  title: string;
  order: number;
  tests: string[];
  open: boolean;
  minutes?: number;
  summary?: string;
  label?: object;
  sampleTask?: string;
  about?: { rulesSources: Ref[]; exemption?: { sources: Ref[] } };
}

export interface ExamContext {
  exams: Pick<ExamRecord, "id" | "faculty" | "title" | "order">[];
  links: string[];
  years: number[];
  topics: string[];
  topicOf: (task: string) => string | undefined;
}

function refProblem(ref: Ref, { links, years }: ExamContext) {
  if ("link" in ref) {
    if (!links.includes(ref.link))
      return `the faculty has no link "${ref.link}"`;
  } else if (!years.includes(ref.cycle)) {
    return `the faculty has no admissions for ${ref.cycle}`;
  }
}

function closedProblem(exam: ExamRecord) {
  if (exam.tests.length > 0) {
    if (exam.minutes !== undefined || exam.summary !== undefined)
      return "an exam with tests takes its minutes from them and has no summary";
    return;
  }
  if (!exam.summary) return "an exam without tests needs a summary";
  if (exam.open || exam.about || exam.sampleTask)
    return "an exam without tests is closed, without about and sampleTask";
}

export function examProblem(exam: ExamRecord, context: ExamContext) {
  if (!/^[a-z0-9]+$/.test(exam.segment) || examPages.includes(exam.segment))
    return `"${exam.segment}" cannot be the address of an exam`;
  const twin = context.exams.find(
    (e) =>
      e.id !== exam.id &&
      e.faculty === exam.faculty &&
      (e.title === exam.title || e.order === exam.order),
  );
  if (twin) return `"${twin.id}" has the same title or order`;
  const closed = closedProblem(exam);
  if (closed) return closed;
  if (exam.open && !exam.label) return "an open exam needs a label";
  if (exam.about && !exam.open) return "only an open exam has an about page";
  const refs = [
    ...(exam.about?.rulesSources ?? []),
    ...(exam.about?.exemption?.sources ?? []),
  ];
  for (const ref of refs) {
    const problem = refProblem(ref, context);
    if (problem) return problem;
  }
  const { sampleTask } = exam;
  if (!sampleTask) return;
  const topic = context.topicOf(sampleTask);
  if (!topic) return `unknown task "${sampleTask}"`;
  if (!context.topics.includes(topic))
    return `"${sampleTask}" is not a task of a topic of the exam`;
}

export function variantProblem(variant: {
  kind: string;
  year?: number;
  held?: string;
}) {
  if (!variant.held) return;
  if (variant.kind !== "official") return "only an official variant is held";
  if (Number(variant.held.slice(0, 4)) !== variant.year)
    return `held is not in ${variant.year}`;
}
