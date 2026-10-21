"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
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
    <main className="flex flex-col items-center gap-5 px-4 pt-16 pb-6 text-center md:pt-24">
      <title>{`${t("title")} · ${meta("title")}`}</title>
      <h1 className="font-bold text-2xl tracking-tight md:text-3xl">
        {t("title")}
      </h1>
      <p className="max-w-md text-subtle">{t("text")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="lime" onClick={retry}>
          {t("retry")}
        </Button>
        <Button variant="ghost" render={<Link href="/" />} nativeButton={false}>
          {notFound("home")}
        </Button>
      </div>
    </main>
  );
}
