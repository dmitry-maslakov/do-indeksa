import { getLocale } from "next-intl/server";
import type { Progress } from "@/features/progress/status";
import type { TaskSummary } from "@/features/tasks/tasks";
import { BankFeed } from "./bank-feed";
import { feedPage } from "./feed";

interface BankListProps {
  tasks: TaskSummary[];
  search: string;
  progress?: Progress;
}

export async function BankList({ tasks, search, progress }: BankListProps) {
  const first = await feedPage(tasks, 0, await getLocale(), progress);
  return <BankFeed key={search} search={search} first={first} />;
}
