import { notFound } from "next/navigation";
import {
  VariantScreen,
  variantMetadata,
} from "@/components/exam/variant-screen";
import { getVariant } from "@/content/variants";
import { setId } from "@/lib/variant-id";
import { findSet } from "@/server/sets";

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
}: PageProps<"/[locale]/v/[code]">) {
  const variant = await load((await params).code);
  if (!variant) notFound();
  return <VariantScreen variant={variant} />;
}
