import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { getTopicPlan } from "@/features/progress/progress";
import { alternates } from "@/i18n/alternates";
import { getProfileId } from "@/server/profile";
import { Home } from "./_components/home";
import { HomeSkeleton } from "./_components/home-skeleton";
import { OneTapGate } from "./_components/one-tap-gate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: { absolute: t("homeTitle") },
    description: t("description"),
    alternates: alternates("/", await getLocale()),
  };
}

const loadHome = async () => getTopicPlan(await getProfileId());

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HomeSkeleton />}>
        <Await promise={loadHome()}>{(home) => <Home {...home} />}</Await>
      </Suspense>
      <Suspense>
        <OneTapGate />
      </Suspense>
    </>
  );
}
