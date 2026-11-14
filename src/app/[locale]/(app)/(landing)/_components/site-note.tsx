import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { examGroups } from "@/features/catalog/exams";
import { facultyOf } from "@/features/catalog/faculties";

export async function SiteNote() {
  const [t, format, locale] = await Promise.all([
    getTranslations("Landing"),
    getFormatter(),
    getLocale(),
  ]);
  const places = examGroups(locale).map(({ id }) => {
    const f = facultyOf(id);
    return t("notePlace", {
      name: f.nameLocative,
      short: f.short,
      cityLocative: f.cityLocative,
    });
  });
  return t("note", { places: format.list(places) });
}
