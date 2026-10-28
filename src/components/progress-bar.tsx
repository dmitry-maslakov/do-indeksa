import { cn } from "cn";
import { clamp } from "es-toolkit";

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
        style={{ width: `${clamp(value, 0, 1) * 100}%` }}
      />
    </div>
  );
}
