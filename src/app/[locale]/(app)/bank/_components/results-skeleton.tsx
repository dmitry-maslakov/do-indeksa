import { Skeleton } from "@/components/ui/skeleton";

export function ResultsSkeleton() {
  return ["w-4/5", "w-3/5", "w-2/3"].map((width) => (
    <div
      key={width}
      className="flex flex-col gap-3 rounded-2xl bg-card px-4 py-4 lg:bg-muted lg:px-5"
    >
      <Skeleton className="h-6 w-40 rounded-md" />
      <Skeleton className="h-4" />
      <Skeleton className={`h-4 ${width}`} />
    </div>
  ));
}
