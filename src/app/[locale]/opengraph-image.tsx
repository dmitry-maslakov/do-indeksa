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

const asset = (name: string) =>
  readFile(join(process.cwd(), "src/app/[locale]/_components", name));

const golos = asset("golos-text-bold.ttf");

const art = asset("preview-art.jpg");

export default async function Image({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "#f4f4f1",
        color: "#111418",
        fontFamily: "Golos",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 120,
          right: 28,
          width: 450,
          height: 358,
          backgroundImage: `url(data:image/jpeg;base64,${(await art).toString("base64")})`,
          backgroundSize: "100% 100%",
        }}
      />
      <div style={{ fontSize: 40, letterSpacing: "-0.05em" }}>do indeksa</div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
        <div
          style={{ fontSize: 68, lineHeight: 1.05, letterSpacing: "-0.035em" }}
        >
          {t("previewTitle")}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            lineHeight: 1.3,
            color: "#5f5f66",
          }}
        >
          {t("previewText")}
        </div>
      </div>
    </div>,
    { ...size, fonts: [{ name: "Golos", data: await golos, weight: 700 }] },
  );
}
