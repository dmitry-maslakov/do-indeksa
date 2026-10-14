import { notFound } from "next/navigation";
import { composeModes } from "@/features/exam/compose";
import { findSet } from "@/features/exam/sets";
import { setId } from "@/features/exam/variant-id";
import { VariantScreen, variantMetadata } from "@/features/exam/variant-screen";
import { getVariant } from "@/features/exam/variants";

export const instant = false;

async function load(code: string) {
  const taskIds = await findSet(code);
  return taskIds && getVariant(setId(taskIds));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/v/[code]">) {
  const variant = await load((await params).code);
  return variant ? variantMetadata(variant) : {};
}

export default async function SetPage({
  params,
  searchParams,
}: PageProps<"/[locale]/v/[code]">) {
  const variant = await load((await params).code);
  if (!variant) notFound();
  const { fallback } = await searchParams;
  return (
    <VariantScreen
      variant={variant}
      fallback={composeModes.find((m) => m === fallback)}
    />
  );
}
