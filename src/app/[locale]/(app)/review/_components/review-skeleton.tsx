import { Skeleton } from "@/components/ui/skeleton";

export function ReviewSkeleton() {
  return (
    <div className="flex flex-col gap-7 pt-2 md:pt-5">
      <Skeleton className="h-3 w-64" />
      <div className="grid gap-5.5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-16 w-48 rounded-xl" />
          <Skeleton className="h-12 w-72 rounded-xl" />
        </div>
        <Skeleton className="h-2.5" />
      </div>
      <div className="grid gap-10 pt-2 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-14">
        <div className="flex flex-col gap-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-3.5" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-2.5" />
          <Skeleton className="h-2.5 w-2/3" />
        </div>
      </div>
    </div>
  );
}
