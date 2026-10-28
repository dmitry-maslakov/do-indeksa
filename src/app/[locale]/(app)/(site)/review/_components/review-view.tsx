import { getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTest } from "@/features/tests/finished-tests";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/server/auth";
import { getProfileId } from "@/server/profile";
import { TestReview } from "./test-review";

export async function ReviewView({
  params,
}: {
  params?: Promise<{ code: string }>;
}) {
  const t = await getTranslations("Review");
  const found = await getTest(await getProfileId(), (await params)?.code);
  const session = await getSession();

  return (
    <>
      <PageTitle className={found ? "sr-only" : "pt-4 pb-5"}>
        {t("title")}
      </PageTitle>
      {!found ? (
        <Card className="max-w-xl items-start gap-4">
          <p className="text-subtle">{t("empty")}</p>
          <Button render={<Link href="/variants" />} nativeButton={false}>
            {t("toVariants")}
          </Button>
        </Card>
      ) : (
        <TestReview found={found} guest={!session} />
      )}
    </>
  );
}
