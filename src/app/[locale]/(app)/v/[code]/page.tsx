import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { composeModes } from "@/features/exam/compose";
import { findSet } from "@/features/exam/sets";
import { setId } from "@/features/exam/variant-id";
import { VariantScreen, variantMetadata } from "@/features/exam/variant-screen";
import { getVariant } from "@/features/exam/variants";
import { redirect } from "@/i18n/navigation";

export const instant = false;

async function load(code: string) {
  const set = await findSet(code);
  const variant = set && getVariant(setId(set.taskIds));
  return variant && { code: set.code, variant };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/v/[code]">) {
  const set = await load((await params).code);
  return set ? variantMetadata(set.variant) : {};
}

export default async function SetPage({
  params,
  searchParams,
}: PageProps<"/[locale]/v/[code]">) {
  const { code } = await params;
  const set = await load(code);
  if (!set) notFound();
  const { fallback } = await searchParams;
  const mode = composeModes.find((m) => m === fallback);
  if (set.code !== code) {
    redirect({
      href: mode ? `/v/${set.code}?fallback=${mode}` : `/v/${set.code}`,
      locale: await getLocale(),
    });
  }
  return (
    <VariantScreen variant={set.variant} code={set.code} fallback={mode} />
  );
}
