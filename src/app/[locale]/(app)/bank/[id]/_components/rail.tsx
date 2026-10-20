"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { LinkTabs } from "@/components/link-tabs";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { Queue } from "@/features/bank/queue";
import { useRouter } from "@/i18n/navigation";
import { RecList } from "./rec-list";

export interface RailProps {
  current: string;
  topic: string;
  topics: { id: string; name: string }[];
  listQuery: string;
  queue: Queue;
  variant?: "rail" | "sheet";
}

const panel = "flex min-h-0 flex-1 flex-col";

export function Rail({
  current,
  topic,
  topics,
  listQuery,
  queue,
  variant = "rail",
}: RailProps) {
  const bank = useTranslations("Bank");
  const router = useRouter();
  const selectId = useId();
  const href = (id: string) => `/bank/${id}`;

  return (
    <div data-variant={variant} className={`group/rail ${panel}`}>
      <div className="flex flex-col gap-4 px-4 pb-4">
        <LinkTabs
          variant="fill"
          items={[
            { href: href(current), label: bank("recommended"), active: true },
            { href: `/bank${listQuery}`, label: bank("all"), active: false },
          ]}
        />
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
      </div>
      <RecList key={current} queue={queue} current={current} href={href} />
    </div>
  );
}
