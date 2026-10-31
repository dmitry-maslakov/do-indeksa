"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { LinkTabs } from "@/components/link-tabs";
import { ProgressBar } from "@/components/progress-bar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WithSearchParams } from "@/components/with-url";
import { type Accuracy, minSample } from "@/features/progress/stats";

type Rows = (Accuracy & { label: string })[];

interface AccuracyCardProps {
  topics: Rows;
  numbers: Rows;
  pending?: boolean;
}

export function AccuracyCard(props: AccuracyCardProps) {
  return (
    <WithSearchParams>
      {(params) => (
        <AccuracyView
          {...props}
          by={params && (params.get("by") === "number" ? "numbers" : "topics")}
        />
      )}
    </WithSearchParams>
  );
}

function AccuracyView({
  by,
  pending,
  ...groups
}: AccuracyCardProps & { by?: "topics" | "numbers" }) {
  const t = useTranslations("Stats");
  const rows = groups[by ?? "topics"];
  return (
    <Card size="lg" className="gap-5">
      <CardHeader>
        <CardTitle>{t("weaker")}</CardTitle>
        <LinkTabs
          label={t("weaker")}
          variant="segmented"
          control="stats_by"
          shallow
          items={[
            { href: "/stats", label: t("topics"), active: by === "topics" },
            {
              href: "/stats?by=number",
              label: t("numbers"),
              value: "number",
              active: by === "numbers",
            },
          ]}
        />
      </CardHeader>
      <ul className="flex flex-col gap-3.5 text-sm md:grid md:grid-cols-[170px_minmax(0,1fr)_56px_74px] md:gap-x-4 md:gap-y-1.5">
        {rows.map((row) => (
          <li
            key={row.key}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 md:col-span-4 md:grid-cols-subgrid"
          >
            {pending ? (
              <Skeleton className="my-1 h-3 w-32" />
            ) : (
              <span
                className={cn("truncate", row.pct === null && "text-subtle")}
              >
                {row.label}
              </span>
            )}
            <span className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto">
              {pending ? (
                <Skeleton className="h-2.5" />
              ) : (
                <ProgressBar value={(row.pct ?? 0) / 100} />
              )}
            </span>
            {pending ? (
              <>
                <Skeleton className="h-3 w-9" />
                <Skeleton className="hidden h-3 w-16 md:block" />
              </>
            ) : (
              <>
                <b
                  className={cn(
                    "font-semibold",
                    row.pct === null && "text-subtle",
                  )}
                >
                  {row.pct === null ? "—" : `${row.pct}%`}
                </b>
                <span className="hidden text-[13px] text-subtle md:block">
                  {t("attempts", { count: row.total })}
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-subtle">
        {t("sample", { count: minSample })}
      </p>
    </Card>
  );
}
