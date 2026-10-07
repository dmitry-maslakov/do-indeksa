import type { Variant } from "content-collections";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { VariantRow } from "@/components/variant-row";
import { positions } from "@/content/exam";
import { curatedVariants, officialVariants } from "@/content/variants";

const blank = positions.map(() => "none" as const);

export default async function VariantsPage() {
  const t = await getTranslations("Variants");
  const minutes = positions.reduce((sum, p) => sum + p.minutes, 0);

  return (
    <main className="px-4 pb-9 md:px-9">
      <div className="flex max-w-4xl flex-wrap items-baseline justify-between gap-2 py-6">
        <h1 className="font-bold text-3xl">{t("title")}</h1>
        <span className="text-sm text-subtle">
          {t("format", { tasks: positions.length, minutes })}
        </span>
      </div>
      <div className="flex max-w-4xl flex-col gap-6">
        <Section title={t("official")} variants={officialVariants} />
        <Section title={t("curated")} variants={curatedVariants} />
      </div>
    </main>
  );
}

function Section({ title, variants }: { title: string; variants: Variant[] }) {
  if (variants.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 font-semibold">{title}</h2>
      <Card className="p-0 md:p-0">
        <ul className="divide-y divide-subtle/15 py-1.5">
          {variants.map((v) => (
            <VariantRow key={v.id} variant={v} segments={blank} />
          ))}
        </ul>
      </Card>
    </section>
  );
}
