import type { Variant } from "content-collections";
import { getTranslations } from "next-intl/server";
import { DailyBanner } from "@/components/daily-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VariantRow } from "@/components/variant-row";
import { dailySize, positions } from "@/content/exam";
import { curatedVariants, officialVariants } from "@/content/variants";
import { Link } from "@/i18n/navigation";

const blank = positions.map(() => "none" as const);

export default async function VariantsPage() {
  const t = await getTranslations("Variants");
  const minutes = positions.reduce((sum, p) => sum + p.minutes, 0);

  return (
    <main className="px-4 pb-9 md:px-9">
      <div className="flex flex-wrap items-baseline justify-between gap-2 py-6">
        <h1 className="font-bold text-3xl">{t("title")}</h1>
        <span className="text-sm text-subtle">
          {t("format", { tasks: positions.length, minutes })}
        </span>
      </div>
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Section title={t("official")} variants={officialVariants} />
          <Section title={t("curated")} variants={curatedVariants} />
        </div>
        <aside className="order-first flex flex-col gap-5 md:order-none">
          <DailyBanner tasks={dailySize} />
          <Card className="gap-3">
            <h2 className="font-semibold text-lg">{t("random")}</h2>
            <p className="text-sm text-subtle">
              {t("randomText", { tasks: positions.length })}
            </p>
            <Button
              variant="secondary"
              className="w-full"
              render={<Link href="/variants/random" prefetch={false} />}
              nativeButton={false}
            >
              {t("compose")}
            </Button>
          </Card>
        </aside>
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
