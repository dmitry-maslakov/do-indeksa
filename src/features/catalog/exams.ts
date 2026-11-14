import "server-only";
import { allExams, allTests, allTopics } from "content-collections";
import { sortBy } from "es-toolkit";
import { z } from "zod";
import { getFaculty } from "./faculties";

const buildExam = ({
  id,
  path,
  faculty,
  title,
  positions,
}: (typeof allExams)[number]) => {
  const byTopic = new Map(positions.map((p) => [p.topic, p]));
  return {
    id,
    path,
    facultyShort: facultyOf(faculty).short,
    title,
    positions,
    topics: [
      ...positions.map((p) => p.topic),
      ...allTopics.map((t) => t.id).filter((topic) => !byTopic.has(topic)),
    ],
    numberOf: (topic: string) => byTopic.get(topic)?.number ?? null,
  };
};

const ordered = sortBy(allExams, ["order"]);
const exams = new Map(ordered.map((e) => [e.id, buildExam(e)]));
const openExams = ordered.filter((e) => e.open);

export function examOf(id: string) {
  const exam = exams.get(id);
  if (!exam) throw new Error(`exam ${id} is missing`);
  return exam;
}

export const openExamIds = openExams.map((e) => e.id);

const openByPath = new Map(openExams.map((e) => [e.path, e.id]));

export const openExamParams = openExams.map((e) => ({
  faculty: e.faculty,
  exam: e.segment,
}));

export const examByPath = (path: string) => openByPath.get(path);

interface ExamParams {
  faculty: string;
  exam: string;
}

const pathOf = ({ faculty, exam }: ExamParams) => `/${faculty}/${exam}`;

export const examByParams = (params: ExamParams) => examByPath(pathOf(params));

const openPathOf = new Map(openExams.map((e) => [e.id, e.path]));

export const openExamPath = (id: string) => openPathOf.get(id);

function openExamAt(path: string) {
  const id = openByPath.get(path);
  if (!id) throw new Error(`exam ${path} is not open`);
  return id;
}

export const examAt = (params: ExamParams) => openExamAt(pathOf(params));

export const examPathSchema = z
  .string()
  .refine((path) => openByPath.has(path))
  .transform(openExamAt);

export const inExam = (examId: string, href: string) =>
  `${examOf(examId).path}${href === "/" ? "" : href}`;

export function firstOpenExam() {
  const exam = openExams[0];
  if (!exam) throw new Error("no exam is open");
  return exam.id;
}

function facultyOf(id: string) {
  const faculty = getFaculty(id);
  if (!faculty) throw new Error(`faculty ${id} is missing`);
  return faculty;
}

export function canonicalHref(topic: string, href: string) {
  const exam = openExams.find((e) => examOf(e.id).topics.includes(topic));
  if (!exam) throw new Error(`no open exam has ${topic}`);
  return inExam(exam.id, href);
}

export const maxPlaces = Math.max(...allExams.map((e) => e.positions.length));

const tests = new Map(allTests.map((t) => [t.id, t]));

export function testFaculty(id: string) {
  const test = tests.get(id);
  if (!test) throw new Error(`test ${id} is missing`);
  return facultyOf(test.faculty).short;
}

export const examOptions = openExams.map((e) => ({
  id: e.id,
  faculty: facultyOf(e.faculty).short,
  title: e.title,
  tasks: e.positions.length,
  hours: (e.minutes ?? 0) / 60,
}));
