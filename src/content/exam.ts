import "server-only";
import { allExams } from "content-collections";

const exam = allExams.find((e) => e.id === "ftn-p1");
if (!exam) throw new Error("exam ftn-p1 is missing");

export const positions = exam.positions;

export const dailySize = exam.daily.size;

const byTopic = new Map(positions.map((p) => [p.topic, p]));

export const positionOf = (topic: string) => byTopic.get(topic);

export const numberOf = (topic: string) => positionOf(topic)?.number ?? 0;

export const minutesAt = (number: number) =>
  positions.find((p) => p.number === number)?.minutes ?? 0;
