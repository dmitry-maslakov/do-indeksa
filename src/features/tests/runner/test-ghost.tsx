import { Skeleton } from "@/components/ui/skeleton";

export function TestGhost() {
  return (
    <div className="flex items-start gap-14">
      <div className="sticky top-3 hidden h-rail w-80 shrink-0 rounded-3xl bg-muted md:block" />
      <div className="flex min-w-0 max-w-task flex-1 flex-col gap-3 pt-4.5 md:pt-3.5">
        <Skeleton className="mb-3 h-3 w-48" />
        {[100, 90, 60].map((width) => (
          <Skeleton
            key={width}
            className="h-4"
            style={{ width: `${width}%` }}
          />
        ))}
      </div>
    </div>
  );
}
