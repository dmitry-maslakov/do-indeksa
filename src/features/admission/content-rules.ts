import { compact, isEqual, range } from "es-toolkit";
import { slugOf } from "@/lib/text";

export interface ProgramRecord {
  slug: string;
  content: string;
  name: string;
  short?: string;
  aliases: string[];
  level: "academic" | "applied";
  years: number;
  espb?: number;
  links: { plan?: object };
  checked?: string;
  degree?: object;
  department?: string;
  jointDepartments?: number;
  plan: { years: number[]; subjects?: string[]; text?: string }[];
  choice?: string;
  modulesFrom?: number;
  modules: { name: string }[];
}

export const moduleIdsOf = (modules: { name: string }[]) =>
  modules.map((m) => slugOf(m.name));

const anchors = ["upis", "predmeti"];

const tagsOf = (p: Pick<ProgramRecord, "short" | "aliases">) =>
  compact([p.short, ...p.aliases]);

function checkedProblem(program: ProgramRecord, examOpen: boolean) {
  const missing = Object.entries({
    content: program.content.trim(),
    espb: program.espb,
    degree: program.degree,
    department: program.department,
    plan: program.plan.length,
    choice: program.choice,
    "links.plan": program.links.plan,
  }).find(([, value]) => !value)?.[0];
  if (missing) return `a checked programme needs ${missing}`;
  if (!examOpen) return "a checked programme needs an open exam";
}

function planProblem({ plan, years }: ProgramRecord) {
  if (plan.some((item) => !item.subjects === !item.text))
    return "a plan item has either subjects or text";
  if (
    plan.length > 0 &&
    !isEqual(
      plan.flatMap((item) => item.years),
      range(1, years + 1),
    )
  )
    return `the plan covers years 1 to ${years} once, in order`;
}

function modulesProblem({ modules, modulesFrom, years }: ProgramRecord) {
  if (modules.length > 0 !== (modulesFrom !== undefined))
    return "modules and modulesFrom come together";
  if (modulesFrom !== undefined && (modulesFrom < 2 || modulesFrom > years))
    return `modulesFrom is between 2 and ${years}`;
  const ids = moduleIdsOf(modules);
  const twin = ids.find((id, i) => ids.indexOf(id) !== i);
  if (twin) return `two modules have the id "${twin}"`;
  const taken = ids.find((id) => anchors.includes(id));
  if (taken) return `"${taken}" cannot be a module id`;
}

export function programProblem(
  program: ProgramRecord,
  siblings: ProgramRecord[],
  examOpen: boolean,
) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(program.slug))
    return "a programme file name is lower-case words joined by dashes";
  if (program.checked) {
    const problem = checkedProblem(program, examOpen);
    if (problem) return problem;
  }
  const plan = planProblem(program) ?? modulesProblem(program);
  if (plan) return plan;
  const others = siblings.filter((p) => p.slug !== program.slug);
  if (others.some((p) => p.name === program.name))
    return `another programme is named "${program.name}"`;
  const tags = tagsOf(program);
  const taken = others.flatMap(tagsOf);
  const repeated = tags.find(
    (tag, i) => tags.indexOf(tag) !== i || taken.includes(tag),
  );
  if (repeated) return `"${repeated}" names another programme`;
  if (program.level === "applied" ? program.years > 3 : program.years < 4)
    return `${program.level} studies do not last ${program.years} years`;
  if (program.jointDepartments && !program.department)
    return "jointDepartments needs the home department";
}

type Bound = { over: number } | { atLeast: number };
type Count = number | null | undefined;
const columns = ["budget", "self"] as const;

interface AdmissionRow {
  budget?: Count;
  self?: Count;
  tuition?: Count;
  cutoff?: { budget: number | null; self: number | null };
}

export interface AdmissionRecord {
  statistics?: string;
  scoring: {
    school: { min: number; max: number };
    exam: { min: number; max: number };
  };
  thresholds: { budget: Bound; self: Bound; examMin?: number };
  tieBreak?: string;
  wishes?: { also: Record<string, string[]> };
  schedule?: { exams: Record<string, unknown[]> };
  fees?: object;
  programs: Record<string, AdmissionRow>;
}

export interface AdmissionContext {
  newest: boolean;
  programs: string[];
  exams: { id: string; points: number; tests: string[] }[];
}

const limitOf = (bound: Bound) =>
  "over" in bound ? bound.over : bound.atLeast;

const meets = (score: number, bound: Bound) =>
  "over" in bound ? score > bound.over : score >= bound.atLeast;

function rowProblem(row: AdmissionRow, admission: AdmissionRecord) {
  if ((row.budget === undefined) !== (row.self === undefined))
    return "budget and self come together";
  if (row.budget === undefined && !row.cutoff)
    return "a row has places or cutoffs";
  if (!row.cutoff !== !admission.statistics)
    return "a year has cutoffs exactly when it has statistics";
  const { school, exam } = admission.scoring;
  for (const column of columns) {
    const score = row.cutoff?.[column];
    if (score == null) continue;
    if (score > school.max + exam.max)
      return `the ${column} cutoff is above the total`;
    if (!meets(score, admission.thresholds[column]))
      return `the ${column} cutoff does not meet its threshold`;
  }
}

function scoringProblem({ scoring, thresholds }: AdmissionRecord) {
  if (scoring.school.min > scoring.school.max)
    return "school points have min above max";
  if (scoring.exam.min > scoring.exam.max)
    return "exam points have min above max";
  const total = scoring.school.max + scoring.exam.max;
  const limits = compact([
    limitOf(thresholds.budget),
    limitOf(thresholds.self),
    thresholds.examMin,
  ]);
  if (limits.some((limit) => limit > total))
    return `a threshold is above ${total}`;
}

function examsProblem(
  { wishes, schedule }: AdmissionRecord,
  { exams }: AdmissionContext,
) {
  const ids = exams.map((e) => e.id);
  const also = Object.entries(wishes?.also ?? {});
  const named = [
    ...also.flatMap(([id, others]) => [id, ...others]),
    ...Object.keys(schedule?.exams ?? {}),
  ];
  const unknown = named.find((id) => !ids.includes(id));
  if (unknown) return `"${unknown}" is not an exam of the faculty`;
  const itself = also.find(([id, others]) => others.includes(id));
  if (itself) return `"${itself[0]}" lists itself`;
}

function newestProblem(admission: AdmissionRecord, context: AdmissionContext) {
  const { tieBreak, wishes, schedule, fees } = admission;
  const missing = Object.entries({ tieBreak, wishes, schedule, fees }).find(
    ([, value]) => !value,
  )?.[0];
  if (missing) return `the newest year needs ${missing}`;
  const unfilled = context.programs.find((slug) => {
    const row = admission.programs[slug];
    return row?.budget == null || row.self == null || row.tuition == null;
  });
  if (unfilled)
    return `the newest year needs places and tuition of ${unfilled}`;
  const unscheduled = context.exams.find((e) => !schedule?.exams[e.id]);
  if (unscheduled) return `the newest year needs the date of ${unscheduled.id}`;
  const max = admission.scoring.exam.max;
  const off = context.exams.find((e) => e.tests.length > 0 && e.points !== max);
  if (off) return `${off.id} gives ${off.points} points, not ${max}`;
}

export function admissionProblem(
  admission: AdmissionRecord,
  context: AdmissionContext,
) {
  for (const [slug, row] of Object.entries(admission.programs)) {
    if (!context.programs.includes(slug)) return `unknown programme "${slug}"`;
    const problem = rowProblem(row, admission);
    if (problem) return `${slug}: ${problem}`;
  }
  return (
    scoringProblem(admission) ??
    examsProblem(admission, context) ??
    (context.newest ? newestProblem(admission, context) : undefined)
  );
}
