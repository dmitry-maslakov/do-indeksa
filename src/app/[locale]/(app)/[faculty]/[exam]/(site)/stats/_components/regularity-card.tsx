import { cn } from "cn";
import { useFormatter, useTranslations } from "next-intl";
import {
  type PracticeDay,
  practiceMonths,
  type Regularity,
} from "@/features/progress/practice-days";
import { hourMs, minuteMs } from "@/lib/dates";
import { useDuration } from "@/lib/use-duration";

const noon = (day: string) => new Date(`${day}T12:00:00Z`);

const steps = [15 * minuteMs, 30 * minuteMs, hourMs];

const shades = [
  "bg-muted",
  "bg-lime",
  "bg-lime-step-1",
  "bg-lime-step-2",
  "bg-lime-step-3",
];

const shadeOf = (day: PracticeDay) =>
  day.active
    ? shades[1 + steps.filter((step) => day.ms >= step).length]
    : shades[0];

const labelled = new Set([0, 2, 4]);

function Day({ day, today }: { day: PracticeDay; today: string }) {
  const format = useFormatter();
  const duration = useDuration();
  if (day.future) return <span />;

  return (
    <span
      title={`${format.dateTime(noon(day.day), { day: "numeric", month: "short", timeZone: "UTC" })} · ${duration(day.ms)}`}
      className={cn(
        "aspect-square rounded-[3px]",
        shadeOf(day),
        day.day === today && "outline-2 outline-foreground outline-offset-1",
      )}
    />
  );
}

interface RegularityCardProps {
  regularity: Regularity;
  streak: number;
  today: string;
}

export function RegularityCard({
  regularity,
  streak,
  today,
}: RegularityCardProps) {
  const t = useTranslations("Stats");
  const format = useFormatter();
  const duration = useDuration();
  const { weeks } = regularity;
  const monthOf = (i: number) => weeks[i]?.[0]?.day.slice(5, 7);
  const summary =
    regularity.days === 0
      ? t("gridEmpty")
      : t("gridSummary", {
          days: regularity.days,
          time: duration(regularity.ms),
        });

  return (
    <section
      aria-labelledby="stats-regularity"
      className="flex flex-col gap-4 md:rounded-[20px] md:border md:p-6"
    >
      <div className="flex flex-col gap-1">
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
        <p className="text-[13px] text-muted-foreground">
          {t("gridPeriod", { months: practiceMonths })} · {summary}
        </p>
      </div>
      <div
        role="img"
        aria-label={`${t("grid")}: ${summary}`}
        className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-1.5 gap-y-1"
      >
        <span />
        <div className="grid auto-cols-fr grid-flow-col gap-[3px] text-[11px] text-subtle">
          {weeks.map((week, i) => (
            <span key={week[0]?.day} className="whitespace-nowrap">
              {i > 1 &&
                monthOf(i) !== monthOf(i - 1) &&
                format.dateTime(noon(week[0]?.day ?? ""), {
                  month: "short",
                  timeZone: "UTC",
                })}
            </span>
          ))}
        </div>
        <div className="grid grid-rows-7 gap-[3px] text-[10px] text-subtle uppercase">
          {weeks[0]?.map((day, i) => (
            <span key={day.day} className="flex items-center leading-none">
              {labelled.has(i) &&
                format.dateTime(noon(day.day), {
                  weekday: "narrow",
                  timeZone: "UTC",
                })}
            </span>
          ))}
        </div>
        <div className="grid auto-cols-fr grid-flow-col grid-rows-7 gap-[3px]">
          {weeks.flat().map((day) => (
            <Day key={day.day} day={day} today={today} />
          ))}
        </div>
      </div>
      <div
        aria-hidden
        className="flex items-center gap-1.5 self-end text-[11px] text-subtle"
      >
        {t("legendNone")}
        {shades.map((shade) => (
          <span key={shade} className={cn("size-3 rounded-[3px]", shade)} />
        ))}
        {t("legendMost", { hours: (steps.at(-1) ?? 0) / hourMs })}
      </div>
    </section>
  );
}
