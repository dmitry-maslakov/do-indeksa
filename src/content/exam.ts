import "server-only";
import { allExams } from "content-collections";

const exam = allExams.find((e) => e.id === "ftn-p1");
if (!exam) throw new Error("exam ftn-p1 is missing");

export const positions = exam.positions;

const numbers = new Map(positions.map((p) => [p.topic, p.number]));

export const numberOf = (topic: string) => numbers.get(topic) ?? 0;
