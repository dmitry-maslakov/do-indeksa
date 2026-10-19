import { getLocale } from "next-intl/server";
import type { Progress } from "@/features/progress/status";
import type { TaskSummary } from "@/features/tasks/tasks";
import { BankFeed } from "./bank-feed";
import { feedPage } from "./feed";

interface BankListProps {
  tasks: TaskSummary[];
  search: string;
  signedIn: boolean;
  progress?: Progress;
}

export async function BankList({
  tasks,
  search,
  signedIn,
  progress,
}: BankListProps) {
  const first = feedPage(tasks, 0, await getLocale(), progress);
  return (
    <BankFeed key={search} search={search} first={first} signedIn={signedIn} />
  );
}
