import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const golos = readFile(
  join(process.cwd(), "src/app/[locale]/launch/golos-text-bold.ttf"),
);

export default async function Image({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Launch" });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 72,
        background: "#2b2560",
        color: "#ffffff",
        fontFamily: "Golos",
        textAlign: "center",
      }}
    >
      <div style={{ position: "absolute", top: 56, left: 64, fontSize: 30 }}>
        do indeksa
      </div>
      <div style={{ fontSize: 72, lineHeight: 1.12, maxWidth: 820 }}>
        {t("title")}
      </div>
      <div
        style={{
          marginTop: 48,
          fontSize: 26,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#b4b3ba",
        }}
      >
        {t("date")}
      </div>
    </div>,
    { ...size, fonts: [{ name: "Golos", data: await golos, weight: 700 }] },
  );
}
