import { getTopicStatuses } from "@/features/progress/progress";
import { getSession } from "@/server/auth";
import { SolveRail, type SolveRailProps } from "./solve-rail";

export async function StatusRail(props: Omit<SolveRailProps, "statuses">) {
  const session = await getSession();
  if (!session) return <SolveRail {...props} />;
  const statuses = await getTopicStatuses(session.user.id, props.topic);
  return <SolveRail {...props} statuses={statuses} />;
}
