import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { getCurrentRun } from "@/features/exam/current-run";
import { getTopicPlan } from "@/features/progress/progress";
import { alternates } from "@/i18n/alternates";
import { getSession } from "@/server/auth";
import { GuestHome } from "./_components/guest-home";
import { HomeSkeleton } from "./_components/home-skeleton";
import { UserHome } from "./_components/user-home";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: { absolute: t("homeTitle") },
    description: t("description"),
    alternates: alternates("/", await getLocale()),
  };
}

async function loadHome() {
  const session = await getSession();
  if (!session) return undefined;
  const [plan, current] = await Promise.all([
    getTopicPlan(session.user.id),
    getCurrentRun(session.user.id),
  ]);
  return { ...plan, current };
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Await promise={loadHome()}>
        {(home) => (home ? <UserHome {...home} /> : <GuestHome />)}
      </Await>
    </Suspense>
  );
}
