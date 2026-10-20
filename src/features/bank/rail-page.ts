import type { TaskStatus } from "@/features/progress/status";

export const railPage = 50;

export interface ListRow {
  id: string;
  html: string;
  status?: TaskStatus;
}

export interface ListPage {
  start: number;
  total: number;
  rows: ListRow[];
}
