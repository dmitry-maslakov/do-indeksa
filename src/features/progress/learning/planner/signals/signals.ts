import type { Signal } from "../contracts";
import { examTask } from "./exam-task";
import { hardNeeded } from "./hard-needed";
import { levelFit } from "./level-fit";

export const signals: Signal[] = [levelFit, hardNeeded, examTask];
