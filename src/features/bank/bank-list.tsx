import { getLocale } from "next-intl/server";
import type { TaskSummary } from "@/features/catalog/tasks";
import type { TaskStatuses } from "@/features/progress/status";
import { BankFeed } from "./bank-feed";
import { bankPage } from "./feed";

interface BankListProps {
  tasks: TaskSummary[];
  search: string;
  statuses?: Promise<TaskStatuses>;
}

export async function BankList({ tasks, search, statuses }: BankListProps) {
  const first = await bankPage(tasks, 0, await getLocale());
  return (
    <BankFeed key={search} search={search} first={first} statuses={statuses} />
  );
}
