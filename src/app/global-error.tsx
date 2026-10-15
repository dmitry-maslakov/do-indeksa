"use client";

import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";
import messages from "../../messages/sr-Latn.json";
import "./globals.css";

export default function GlobalError({ retry }: { retry: () => void }) {
  const t = messages.Errors;
  return (
    <html lang={routing.defaultLocale}>
      <body>
        <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
          <title>{t.title}</title>
          <PageTitle className="p-0">{t.title}</PageTitle>
          <p className="max-w-md text-subtle">{t.text}</p>
          <Button onClick={retry}>{t.retry}</Button>
        </main>
      </body>
    </html>
  );
}
