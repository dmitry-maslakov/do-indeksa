"use client";

import { useTranslations } from "next-intl";
import { LinkTabs } from "@/components/link-tabs";
import { RailContent, RailSelect, type RailVariant } from "@/components/rail";
import { NativeSelectOption } from "@/components/ui/native-select";
import type { Queue } from "@/features/bank/queue/queue";
import { useRouter } from "@/i18n/navigation";
import { QueueList } from "./queue-list";

export interface RailProps {
  current: string;
  topic: string;
  topics: { id: string; name: string; href: string }[];
  listQuery: string;
  queue: Queue;
  variant?: RailVariant;
}

export function Rail({
  current,
  topic,
  topics,
  listQuery,
  queue,
  variant,
}: RailProps) {
  const bank = useTranslations("Bank");
  const router = useRouter();
  const href = (id: string) => `/bank/${id}`;

  return (
    <RailContent variant={variant}>
      <div className="flex flex-col gap-4 px-4 pb-4">
        <LinkTabs
          label={bank("title")}
          variant="fill"
          items={[
            { href: href(current), label: bank("recommended"), active: true },
            { href: `/bank${listQuery}`, label: bank("all"), active: false },
          ]}
        />
        <RailSelect
          label={bank("topic")}
          value={topic}
          onChange={(e) => {
            const next = topics.find((x) => x.id === e.target.value);
            if (next) router.push(next.href);
          }}
        >
          {topics.map((x) => (
            <NativeSelectOption key={x.id} value={x.id}>
              {x.name}
            </NativeSelectOption>
          ))}
        </RailSelect>
      </div>
      <QueueList key={current} queue={queue} current={current} href={href} />
    </RailContent>
  );
}
