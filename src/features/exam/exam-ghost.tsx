import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ExamGhost() {
  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
      <Card size="sm" className="gap-4 max-md:order-1">
        <Skeleton className="my-1.5 h-3 w-32" />
        <Skeleton className="h-11 rounded-lg" />
      </Card>
      <Card className="gap-3 md:p-9">
        {[100, 90, 60].map((width) => (
          <Skeleton
            key={width}
            className="h-4"
            style={{ width: `${width}%` }}
          />
        ))}
      </Card>
    </div>
  );
}
