"use client";

import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { mistakeDays } from "@/features/progress/topic-mistakes";
import { Link } from "@/i18n/navigation";

interface MistakeRow {
  topic: string;
  name: string;
  tasks: number;
  wrong: number;
  minutes: number;
}

const shown = 5;

export function MistakesCard({ rows }: { rows: MistakeRow[] }) {
  const t = useTranslations("Stats");
  const [all, setAll] = useState(false);
  const visible = all ? rows : rows.slice(0, shown);
  const cell = "py-2.5 text-right tabular-nums";

  return (
    <section
      aria-labelledby="stats-mistakes"
      className="flex flex-col gap-3 md:rounded-[20px] md:border md:p-6"
    >
      <div className="flex items-baseline gap-2.5">
        <h2 id="stats-mistakes" className="font-semibold text-[17px]">
          {t("mistakes")}
        </h2>
        <span className="text-[13px] text-subtle">
          {t("mistakesPeriod", { days: mistakeDays })}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-muted px-5 py-4 text-sm text-subtle">
          {t("mistakesEmpty")}
        </p>
      ) : (
        <>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-subtle text-xs">
                <th scope="col" className="pb-2 font-normal">
                  {t("topic")}
                </th>
                <th scope="col" className="pb-2 text-right font-normal">
                  {t("solved")}
                </th>
                <th scope="col" className="pb-2 pl-3 text-right font-normal">
                  {t("wrong")}
                </th>
                <th scope="col" className="pb-2 pl-3 text-right font-normal">
                  {t("mean")}
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.topic} className="border-t">
                  <th scope="row" className="py-2.5 pr-2 text-left font-medium">
                    <Link
                      href={`/bank/start/${row.topic}`}
                      className="rounded-sm outline-none hover:underline hover:underline-offset-3 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {row.name}
                    </Link>
                  </th>
                  <td className={`${cell} text-muted-foreground`}>
                    {row.tasks}
                  </td>
                  <td
                    className={`${cell} pl-3 ${row.wrong > 0 ? "font-bold text-error-text" : "text-muted-foreground"}`}
                  >
                    {row.wrong}
                  </td>
                  <td
                    className={`${cell} whitespace-nowrap pl-3 text-muted-foreground`}
                  >
                    {t("minutes", { minutes: row.minutes })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > shown && (
            <button
              type="button"
              aria-expanded={all}
              onClick={() => setAll(!all)}
              className="inline-flex items-center gap-1 self-start rounded-sm text-[13px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {all ? t("fewerTopics") : t("allTopics")}
              <ChevronDownIcon
                aria-hidden
                className={all ? "size-3.5 rotate-180" : "size-3.5"}
              />
            </button>
          )}
        </>
      )}
    </section>
  );
}
