import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { getCurrentRun } from "@/features/exam/current-run";
import { getTopicPlan } from "@/features/progress/progress";
import { alternates } from "@/i18n/alternates";
import { getProfileId } from "@/server/auth";
import { Home } from "./_components/home";
import { HomeSkeleton } from "./_components/home-skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: { absolute: t("homeTitle") },
    description: t("description"),
    alternates: alternates("/", await getLocale()),
  };
}

async function loadHome() {
  const profileId = await getProfileId();
  const [plan, current] = await Promise.all([
    getTopicPlan(profileId),
    profileId ? getCurrentRun(profileId) : undefined,
  ]);
  return { ...plan, current };
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Await promise={loadHome()}>{(home) => <Home {...home} />}</Await>
    </Suspense>
  );
}
