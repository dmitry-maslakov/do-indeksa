import { getFormatter, getTranslations } from "next-intl/server";

const partsOf = (iso: string) => {
  const [year = "", month = "", day = ""] = iso.split("-");
  return { year, month: Number(month), day: String(Number(day)) };
};

export async function getFacts() {
  const [format, t] = await Promise.all([
    getFormatter(),
    getTranslations("Facts"),
  ]);
  const monthOf = (iso: string) => t("month", { month: partsOf(iso).month });
  const day = (iso: string) =>
    t("day", { day: partsOf(iso).day, month: monthOf(iso) });
  const sameMonth = (isos: string[]) =>
    new Set(isos.map((iso) => iso.slice(0, 7))).size === 1;

  return {
    count: (n: number) => format.number(n),
    money: (n: number) => format.number(n),
    score: (n: number) =>
      format.number(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    euro: (n: number) =>
      format.number(n, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    date: (iso: string) => t("date", { ...partsOf(iso), month: monthOf(iso) }),
    day,
    days: (isos: string[]) =>
      isos.length > 0 && sameMonth(isos)
        ? t("daysInMonth", {
            days: format.list(
              isos.map((iso) => t("dayNumber", { day: partsOf(iso).day })),
            ),
            month: monthOf(isos[0] ?? ""),
          })
        : format.list(isos.map(day)),
    span: (from: string, to: string) =>
      sameMonth([from, to])
        ? t("spanInMonth", {
            from: partsOf(from).day,
            to: partsOf(to).day,
            month: monthOf(to),
          })
        : t("span", { from: day(from), to: day(to) }),
    schoolYear: (year: number) => `${year}/${String(year + 1).slice(-2)}`,
    word: (n: number) => t("word", { n }),
  };
}
