import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import {
  VariantScreen,
  variantMetadata,
} from "@/components/exam/variant-screen";
import { getVariant } from "@/content/variants";
import { redirect } from "@/i18n/navigation";
import { saveSet } from "@/server/sets";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/variants/[id]">) {
  const variant = getVariant((await params).id);
  return variant ? variantMetadata(variant) : {};
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
