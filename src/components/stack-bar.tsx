import { cn } from "cn";

interface StackBarProps {
  parts: { key: string; value: number; className: string }[];
  label: string;
}

export function StackBar({ parts, label }: StackBarProps) {
  const total = parts.reduce((sum, p) => sum + p.value, 0) || 1;

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
