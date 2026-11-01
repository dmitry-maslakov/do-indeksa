import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { Period } from "@/features/bank/queue/earlier";
import { dateIn } from "@/lib/dates";

const headingLine =
  "before:pointer-events-none before:absolute before:inset-y-0 before:left-[15.25px] before:w-[1.5px] before:bg-input first-of-type:before:top-4 after:pointer-events-none after:absolute after:top-4 after:left-[12.5px] after:size-[7px] after:-translate-y-1/2 after:rounded-full after:bg-input";

interface EarlierHeadingProps {
  period: Period;
  tz: string;
  now: number;
  count: number;
  open: boolean;
  onToggle: (heading: HTMLElement) => void;
}

export function EarlierHeading({
  period,
  tz,
  now,
  count,
  open,
  onToggle,
}: EarlierHeadingProps) {
  const t = useTranslations("Solve");
  const format = useFormatter();
  const yearOf = (day: string) =>
    day.slice(0, 4) === dateIn(now, tz).slice(0, 4)
      ? undefined
      : ("numeric" as const);
  const date = () => {
    if (period.kind === "day")
      return format.dateTime(Date.parse(period.day), {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: yearOf(period.day),
        timeZone: "UTC",
      });
    if (period.kind === "week")
      return format.dateTimeRange(
        Date.parse(period.from),
        Date.parse(period.to),
        {
          day: "numeric",
          month: "short",
          year: yearOf(period.to),
          timeZone: "UTC",
        },
      );
    return "";
  };
  const time =
    period.kind === "today" || period.kind === "yesterday"
      ? format.dateTime(period.at, {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: tz,
        })
      : "";
  return (
    <h3 className={cn("relative", headingLine)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={(event) => onToggle(event.currentTarget)}
        className="flex w-full items-center gap-2 rounded-lg pt-2 pr-2 pb-1 pl-8 text-left font-medium text-subtle text-xs leading-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span className="flex-1 first-letter:uppercase">
          {t("earlierGroup", { period: period.kind, time, date: date() })}
          {!open && ` · ${count}`}
        </span>
        <ChevronDownIcon
          aria-hidden
          className={cn(
            "size-3.5 transition-transform duration-220 motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>
    </h3>
  );
}
