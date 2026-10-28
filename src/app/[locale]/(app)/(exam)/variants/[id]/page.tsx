import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { TestScreen } from "@/features/tests/runner/test-screen";
import { saveSet } from "@/features/variants/custom/sets";
import { variantMetadata } from "@/features/variants/variant-title";
import { contentVariants, getVariant } from "@/features/variants/variants";
import { alternates } from "@/i18n/alternates";
import { redirect } from "@/i18n/navigation";

export const instant = false;

export function generateStaticParams() {
  return contentVariants.slice(0, 1).map((v) => ({ id: v.id }));
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
  return <TestScreen variant={variant} />;
}
