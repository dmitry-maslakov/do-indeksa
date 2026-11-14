import { Skeleton } from "@/components/ui/skeleton";

export function StatsSkeleton() {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Skeleton className="h-96 rounded-[20px]" />
      <div className="flex flex-col gap-6">
        <Skeleton className="h-80 rounded-[20px]" />
        <Skeleton className="h-64 rounded-[20px]" />
      </div>
    </div>
  );
}
