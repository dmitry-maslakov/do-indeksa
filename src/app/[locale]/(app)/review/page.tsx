import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ReviewSkeleton } from "./_components/review-skeleton";
import { ReviewView } from "./_components/review-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Review");
  return { title: t("title") };
}

export default function ReviewPage() {
  return (
    <main className="max-w-300 px-4 pb-10 md:px-10 md:pb-14">
      <Suspense fallback={<ReviewSkeleton />}>
        <ReviewView />
      </Suspense>
    </main>
  );
}
