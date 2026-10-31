import type { TopicSignal } from "../contracts";
import { finishTopic } from "./finish-topic";
import { keepGoing } from "./keep-going";
import { keepInShape } from "./keep-in-shape";
import { review } from "./review";
import { startNext } from "./start-next";
import { stuck } from "./stuck";
import { switchTopic } from "./switch-topic";

export const topicSignals: TopicSignal[] = [
  stuck,
  review,
  finishTopic,
  keepGoing,
  switchTopic,
  startNext,
  keepInShape,
];
