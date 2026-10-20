"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import type { Queue } from "@/features/bank/queue";
import { Link, useRouter } from "@/i18n/navigation";
import { AllList } from "./all-list";
import { RecList } from "./rec-list";

export interface RailProps {
  current: string;
  topic: string;
  topics: { id: string; name: string }[];
  query: string;
  listQuery: string;
  scope: string | null;
  queue: Queue;
  variant?: "rail" | "sheet";
}

const panel = "flex min-h-0 flex-1 flex-col";

function Scope({ label, current }: { label: string; current: string }) {
  const t = useTranslations("Solve");
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-card py-2 pr-2 pl-3 text-xs group-data-[variant=sheet]/rail:bg-muted">
      <span>
        <span className="text-subtle">{t("fromList")}</span>{" "}
        <b className="font-semibold">{label}</b>
      </span>
      <Link
        href={`/bank/${current}`}
        aria-label={t("clearScope")}
        className="flex size-7 items-center justify-center rounded-lg hover:bg-muted"
      >
        <XIcon className="size-4" />
      </Link>
    </div>
  );
}

export function Rail({
  current,
  topic,
  topics,
  query,
  listQuery,
  scope,
  queue,
  variant = "rail",
}: RailProps) {
  const bank = useTranslations("Bank");
  const router = useRouter();
  const selectId = useId();
  const href = (id: string) => `/bank/${id}${query}`;

  return (
    <Tabs
      defaultValue="recommended"
      data-variant={variant}
      className={`group/rail ${panel}`}
    >
      <div className="flex flex-col gap-4 px-4 pb-4">
        <TabsList className="group-data-[variant=sheet]/rail:bg-muted">
          <TabsTab value="recommended">{bank("recommended")}</TabsTab>
          <TabsTab value="all">{bank("all")}</TabsTab>
        </TabsList>
        <div className="flex flex-col gap-1">
          <label htmlFor={selectId} className="text-muted-foreground text-xs">
            {bank("topic")}
          </label>
          <NativeSelect
            id={selectId}
            size="md"
            variant="card"
            className="w-full"
            value={topic}
            onChange={(e) => router.push(`/bank/start/${e.target.value}`)}
          >
            {topics.map((x) => (
              <NativeSelectOption key={x.id} value={x.id}>
                {x.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        {scope && <Scope label={scope} current={current} />}
      </div>
      <TabsPanel value="recommended" className={panel}>
        <RecList key={current} queue={queue} current={current} href={href} />
      </TabsPanel>
      <TabsPanel value="all" className={panel}>
        <AllList search={listQuery} current={current} href={href} />
      </TabsPanel>
    </Tabs>
  );
}
