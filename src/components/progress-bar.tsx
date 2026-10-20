import { cn } from "cn";

interface ProgressBarProps {
  value: number;
  tone?: string;
  className?: string;
}

export function ProgressBar({
  value,
  tone = "bg-data",
  className,
}: ProgressBarProps) {
  return (
    <div className={cn("h-2.5 rounded-full bg-untouched", className)}>
      <div
        className={cn("h-full rounded-full", tone)}
        style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }}
      />
    </div>
  );
}
