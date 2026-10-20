import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <main className="flex flex-col gap-4 px-4 pt-4 pb-6 md:gap-5 md:px-10 md:pt-6 md:pb-8">
      <div className="flex flex-col gap-4 pt-5 pb-7 md:pt-7 md:pb-10">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72 md:h-12" />
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </main>
  );
}
