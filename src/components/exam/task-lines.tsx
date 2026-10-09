import type { ReactNode } from "react";
import type { ExamTask } from "@/content/variants";

interface TaskLinesProps {
  tasks: ExamTask[];
  end: (task: ExamTask, index: number) => ReactNode;
}

export function TaskLines({ tasks, end }: TaskLinesProps) {
  return (
    <ul className="flex flex-col divide-y divide-subtle/15 text-sm">
      {tasks.map((task, i) => (
        <li key={task.id} className="flex items-center gap-3 py-3">
          <span className="w-8 font-semibold">{task.number}</span>
          <span className="min-w-0 flex-1 truncate">{task.topicName}</span>
          {end(task, i)}
        </li>
      ))}
    </ul>
  );
}
