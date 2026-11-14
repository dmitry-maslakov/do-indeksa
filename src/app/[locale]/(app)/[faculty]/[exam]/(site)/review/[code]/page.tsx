import { Suspense } from "react";
import { firstOpenExam } from "@/features/catalog/exams";
import { ReviewSkeleton } from "../_components/review-skeleton";
import { ReviewView } from "../_components/review-view";

export { generateMetadata } from "../page";

export default function ReviewCodePage({
  params,
}: PageProps<"/[locale]/review/[code]">) {
  return (
    <main className="px-4 pb-10 md:px-10 md:pb-14">
      <Suspense fallback={<ReviewSkeleton />}>
        <ReviewView examId={firstOpenExam()} params={params} />
      </Suspense>
    </main>
  );
}
