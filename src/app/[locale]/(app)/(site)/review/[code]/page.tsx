import { Suspense } from "react";
import { ReviewSkeleton } from "../_components/review-skeleton";
import { ReviewView } from "../_components/review-view";

export { generateMetadata } from "../page";

export default function ReviewCodePage({
  params,
}: PageProps<"/[locale]/review/[code]">) {
  return (
    <main className="max-w-300 px-4 pb-10 md:px-10 md:pb-14">
      <Suspense fallback={<ReviewSkeleton />}>
        <ReviewView params={params} />
      </Suspense>
    </main>
  );
}
