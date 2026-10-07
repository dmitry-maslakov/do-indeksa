import { cn } from "cn";

interface ScoreProps {
  value: number;
  max: number;
  className?: string;
}

export function Score({ value, max, className }: ScoreProps) {
  return (
    <span className={cn("text-[13px]", className)}>
      <b className="font-semibold">{value}</b>{" "}
      <span className="text-subtle">/ {max}</span>
    </span>
  );
}
