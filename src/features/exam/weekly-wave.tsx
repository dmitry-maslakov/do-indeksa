import { cn } from "cn";

export function WeeklyWave({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 395 240"
      preserveAspectRatio="none"
      className={cn("absolute inset-y-0 right-0 size-full", className)}
    >
      <path
        d="M395 63C375 63 360 131 329 131C300 131 290 93 264 93C238 93 240 204 224 204C208 204 190 151 153 151C120 151 100 210 83 240H395Z"
        className="fill-lime-strong"
      />
    </svg>
  );
}
