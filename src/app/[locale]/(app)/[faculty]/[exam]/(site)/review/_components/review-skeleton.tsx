import { Skeleton } from "@/components/ui/skeleton";

export function ReviewSkeleton() {
  return (
    <div className="flex flex-col gap-6 pt-2 md:gap-8 md:pt-5">
      <div className="flex flex-col gap-4 md:gap-5">
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-9 w-56 rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[26.25rem_minmax(0,1fr)] lg:gap-6">
        <Skeleton className="h-12 rounded-[10px] lg:h-110 lg:rounded-[20px]" />
        <Skeleton className="h-96 rounded-[20px]" />
      </div>
    </div>
  );
}
