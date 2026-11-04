import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type {
  PracticeDay,
  Regularity,
} from "@/features/progress/practice-days";
import { toMinutes } from "@/lib/dates";
import { useDuration } from "@/lib/use-duration";

const noon = (day: string) => new Date(`${day}T12:00:00Z`);

function Day({ day, today }: { day: PracticeDay; today: boolean }) {
  const t = useTranslations("Stats");
  const format = useFormatter();
  const minutes = toMinutes(day.ms);

  return (
    <li className="flex flex-col items-center gap-1">
      <span className="text-[11px] text-subtle uppercase">
        {format.dateTime(noon(day.day), { weekday: "narrow", timeZone: "UTC" })}
      </span>
      <span
        className={cn(
          "grid size-8 place-items-center rounded-full md:size-8.5",
          day.active && "bg-lime",
          !day.active && today && "border-2 border-foreground",
          !day.active && !today && "border-[1.5px] border-input border-dashed",
          day.future && !today && "opacity-50",
        )}
      >
        {day.active && <CheckIcon aria-hidden className="size-4 stroke-3" />}
      </span>
      <span className="text-[10px] text-muted-foreground tabular-nums md:text-[11px]">
        {day.active
          ? t("minutes", { minutes })
          : today
            ? t("today")
            : day.future
              ? ""
              : "—"}
      </span>
    </li>
  );
}

interface RegularityCardProps {
  regularity: Regularity;
  streak: number;
}

export function RegularityCard({ regularity, streak }: RegularityCardProps) {
  const t = useTranslations("Stats");
  const format = useFormatter();
  const duration = useDuration();
  const minutes = toMinutes(regularity.weekMs);
  const weeks = regularity.weeks.map((week) => ({
    start: week.start,
    minutes: toMinutes(week.ms),
  }));
  const longest = Math.max(1, ...weeks.map((week) => week.minutes));
  const today = regularity.week.findLast((d) => !d.future)?.day;

  return (
    <section
      aria-labelledby="stats-regularity"
      className="flex flex-col gap-5 rounded-[20px] border p-4 md:p-6"
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <h2 id="stats-regularity" className="font-semibold text-[17px]">
          {t("regularity")}
        </h2>
        {streak > 0 && (
          <span className="rounded-full bg-overtime-tint px-2.5 py-0.5 font-semibold text-[13px] text-overtime-text">
            {t("streak", { count: streak })}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2.5">
        <p className="flex justify-between gap-3 text-[13px]">
          <span className="font-semibold">{t("thisWeek")}</span>
          <span className="font-semibold tabular-nums">
            {regularity.weekDays === 0
              ? t("weekEmpty")
              : t("weekSummary", {
                  days: regularity.weekDays,
                  time:
                    minutes > 0
                      ? duration(regularity.weekMs)
                      : t("minutes", { minutes }),
                })}
          </span>
        </p>
        <ol
          aria-label={t("days")}
          className="grid grid-cols-7 gap-1 md:gap-1.5"
        >
          {regularity.week.map((day) => (
            <Day key={day.day} day={day} today={day.day === today} />
          ))}
        </ol>
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-semibold text-[13px]">
          {t("perWeek")}{" "}
          <span className="font-normal text-subtle">· {t("perWeekNote")}</span>
        </p>
        <div role="img" aria-label={t("weeks")} className="flex flex-col gap-1">
          <div className="flex h-20 items-end gap-1.5 border-b md:gap-2">
            {weeks.map((week, i) => (
              <div
                key={week.start}
                className="flex h-full flex-1 flex-col items-center justify-end gap-0.5"
              >
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {week.minutes > 0 ? week.minutes : ""}
                </span>
                <span
                  className={cn(
                    "w-full rounded-t-md rounded-b-[2px]",
                    i === weeks.length - 1 ? "bg-progress" : "bg-progress-tint",
                  )}
                  style={{ height: `${(week.minutes / longest) * 70}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 md:gap-2">
            {weeks.map((week) => (
              <span
                key={week.start}
                className="flex-1 text-center text-[10px] text-subtle tabular-nums"
              >
                {format.dateTime(noon(week.start), {
                  day: "numeric",
                  month: "numeric",
                  timeZone: "UTC",
                })}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
