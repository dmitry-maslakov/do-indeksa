import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import {
  VariantScreen,
  variantMetadata,
} from "@/components/exam/variant-screen";
import { contentVariants, getVariant } from "@/content/variants";
import { alternates } from "@/i18n/alternates";
import { redirect } from "@/i18n/navigation";
import { saveSet } from "@/server/sets";

export const instant = false;

export function generateStaticParams() {
  return contentVariants.map((v) => ({ id: v.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/variants/[id]">) {
  const { id } = await params;
  const variant = getVariant(id);
  if (!variant) return {};
  const metadata = await variantMetadata(variant);
  return contentVariants.some((v) => v.id === id)
    ? {
        ...metadata,
        alternates: alternates(`/variants/${id}`, await getLocale()),
      }
    : metadata;
}

export default async function VariantPage({
  params,
}: PageProps<"/[locale]/variants/[id]">) {
  const { id } = await params;
  if (id === "daily") redirect({ href: "/daily", locale: await getLocale() });
  const variant = getVariant(id);
  if (!variant) notFound();
  if (variant.kind === "custom") {
    redirect({
      href: `/v/${await saveSet(variant.taskIds)}`,
      locale: await getLocale(),
    });
  }
  return <VariantScreen variant={variant} />;
}
