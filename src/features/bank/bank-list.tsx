import { getLocale } from "next-intl/server";
import type { TaskSummary } from "@/features/catalog/tasks";
import type { Progress } from "@/features/progress/status";
import { BankFeed } from "./bank-feed";
import { bankPage } from "./feed";

interface BankListProps {
  tasks: TaskSummary[];
  search: string;
  progress?: Progress;
}

export async function BankList({ tasks, search, progress }: BankListProps) {
  const first = bankPage(tasks, 0, await getLocale(), progress);
  return <BankFeed key={search} search={search} first={first} />;
}
