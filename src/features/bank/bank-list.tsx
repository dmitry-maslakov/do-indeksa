import { getLocale } from "next-intl/server";
import type { TaskSummary } from "@/features/catalog/tasks";
import type { TaskStatuses } from "@/features/progress/status";
import { BankFeed } from "./bank-feed";
import { bankPage } from "./feed";

interface BankListProps {
  tasks: TaskSummary[];
  search: string;
  offset: number;
  paged?: string;
  statuses?: Promise<TaskStatuses>;
}

export async function BankList({
  tasks,
  search,
  offset,
  paged,
  statuses,
}: BankListProps) {
  const first = await bankPage(tasks, offset, await getLocale());
  return (
    <BankFeed
      key={search}
      search={search}
      first={first}
      offset={offset}
      paged={paged}
      statuses={statuses}
    />
  );
}
