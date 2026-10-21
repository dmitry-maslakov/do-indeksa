"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { reportError } from "@/lib/sentry-browser";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("Errors");
  const meta = useTranslations("Metadata");
  const notFound = useTranslations("NotFound");
  useEffect(() => {
    reportError(error);
  }, [error]);
  return (
    <main className="flex flex-col items-center gap-6 px-4 py-24 text-center">
      <title>{`${t("title")} · ${meta("title")}`}</title>
      <PageTitle className="p-0">{t("title")}</PageTitle>
      <p className="max-w-md text-subtle">{t("text")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={retry}>{t("retry")}</Button>
        <Button variant="ghost" render={<Link href="/" />} nativeButton={false}>
          {notFound("home")}
        </Button>
      </div>
    </main>
  );
}
