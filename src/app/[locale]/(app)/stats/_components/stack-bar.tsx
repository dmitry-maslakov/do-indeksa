import { cn } from "cn";
import { sumBy } from "es-toolkit";

interface StackBarProps {
  parts: { key: string; value: number; className: string }[];
  label: string;
}

export function StackBar({ parts, label }: StackBarProps) {
  const total = sumBy(parts, (p) => p.value) || 1;

  return (
    <div
      role="img"
      aria-label={label}
      className="flex h-3.5 gap-[3px] overflow-hidden rounded-full bg-untouched"
    >
      {parts
        .filter((p) => p.value > 0)
        .map((p) => (
          <span
            key={p.key}
            className={cn("h-full", p.className)}
            style={{ width: `${(p.value / total) * 100}%` }}
          />
        ))}
    </div>
  );
}
