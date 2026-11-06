import "server-only";
import { allExams, allTopics } from "content-collections";

export const defaultExam = "ftn-p1";

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

const exams = new Map(allExams.map((e) => [e.id, buildExam(e)]));

export function examOf(id = defaultExam) {
  const exam = exams.get(id);
  if (!exam) throw new Error(`exam ${id} is missing`);
  return exam;
}

export const maxPlaces = Math.max(...allExams.map((e) => e.positions.length));

export const examOptions = allExams.map((e) => ({
  id: e.id,
  faculty: e.faculty,
  title: e.title,
  tasks: e.positions.length,
  hours: e.durationMinutes / 60,
}));
