import "server-only";
import {
  allExams,
  allFaculties,
  allTests,
  allTopics,
} from "content-collections";
import { sortBy } from "es-toolkit";

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
const firstOpen = openExams[0]?.id;

export function examOf(id = firstOpen) {
  const exam = id && exams.get(id);
  if (!exam) throw new Error(`exam ${id} is missing`);
  return exam;
}

export const maxPlaces = Math.max(...allExams.map((e) => e.positions.length));

const faculties = new Map(allFaculties.map((f) => [f.id, f]));

function facultyOf(id: string) {
  const faculty = faculties.get(id);
  if (!faculty) throw new Error(`faculty ${id} is missing`);
  return faculty;
}

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
  hours: e.minutes / 60,
}));
