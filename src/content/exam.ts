import "server-only";
import { allExams } from "content-collections";

export const currentExam = "ftn-p1";

const exam = allExams.find((e) => e.id === currentExam);
if (!exam) throw new Error(`exam ${currentExam} is missing`);

export const examOptions = allExams.map((e) => ({
  id: e.id,
  faculty: e.faculty,
  title: e.title,
  tasks: e.positions.length,
  hours: e.durationMinutes / 60,
}));

export const positions = exam.positions;

export const maxPoints = positions.reduce((sum, p) => sum + p.points, 0);

export const durationHours = exam.durationMinutes / 60;

export const dailySize = exam.daily.size;

const byTopic = new Map(positions.map((p) => [p.topic, p]));

export const positionOf = (topic: string) => byTopic.get(topic);

export const numberOf = (topic: string) => positionOf(topic)?.number ?? 0;

export const minutesAt = (number: number) =>
  positions.find((p) => p.number === number)?.minutes ?? 0;
