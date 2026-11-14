import { getFormatter, getTranslations } from "next-intl/server";
import { openFaculties } from "@/features/catalog/exams";

export async function SiteNote() {
  const [t, format] = await Promise.all([
    getTranslations("Landing"),
    getFormatter(),
  ]);
  const places = openFaculties.map((f) =>
    t("notePlace", {
      name: f.nameLocative,
      short: f.short,
      cityLocative: f.cityLocative,
    }),
  );
  return t("note", { places: format.list(places) });
}
