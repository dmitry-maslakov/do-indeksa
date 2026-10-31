import type { Signal } from "../contracts";
import { examTask } from "./exam-task";
import { hardNeeded } from "./hard-needed";
import { levelFit } from "./level-fit";
import { repeatDue } from "./repeat-due";

export const signals: Signal[] = [levelFit, hardNeeded, examTask, repeatDue];
