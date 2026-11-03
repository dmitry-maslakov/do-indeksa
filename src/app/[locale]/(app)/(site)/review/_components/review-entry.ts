import type { PartOutcome } from "@/db/columns";
import type { PartLabel } from "@/features/catalog/parts";
import type { PartAnswer } from "@/features/tests/review";
import type { Segment } from "@/lib/strip";

export interface ReviewEntry {
  taskId: string;
  number: number;
  topicName: string;
  statement: string;
  parts: PartLabel[];
  points: number;
  earned: number;
  segment: Segment;
  ms: number;
  minutesSpent: number;
  answers: PartAnswer[];
  outcomes: PartOutcome[];
}
