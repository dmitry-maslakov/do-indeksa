import "server-only";
import { allExams, allTests, allTopics } from "content-collections";
import { sortBy } from "es-toolkit";
import { getFaculty } from "./faculties";

const buildExam = ({ id, positions }: (typeof allExams)[number]) => {
  const byTopic = new Map(positions.map((p) => [p.topic, p]));
  return {
    id,
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

export function firstOpenExam() {
  const exam = openExams[0];
  if (!exam) throw new Error("no exam is open");
  return exam.id;
}

export const maxPlaces = Math.max(...allExams.map((e) => e.positions.length));

const tests = new Map(allTests.map((t) => [t.id, t]));

export function testFaculty(id: string) {
  const test = tests.get(id);
  if (!test) throw new Error(`test ${id} is missing`);
  return getFaculty(test.faculty).short;
}

export const examOptions = openExams.map((e) => ({
  id: e.id,
  faculty: getFaculty(e.faculty).short,
  title: e.title,
  tasks: e.positions.length,
  hours: (e.minutes ?? 0) / 60,
}));
