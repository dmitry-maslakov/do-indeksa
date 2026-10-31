"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { LinkTabs } from "@/components/link-tabs";
import { RailContent, RailSelect, type RailVariant } from "@/components/rail";
import { NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Queue } from "@/features/bank/queue/queue";
import { useRouter } from "@/i18n/navigation";
import { rememberIntent } from "@/lib/analytics-browser";
import { QueueList } from "./queue-list";

export interface RailProps {
  current: string;
  topic: string;
  topics: { id: string; name: string }[];
  listHref: string;
  queue: Promise<Queue>;
  starts: Promise<Record<string, string>>;
  variant?: RailVariant;
}

function QueueSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-2 border-t px-4 pt-4">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <Skeleton key={n} className="h-12 rounded-lg" />
      ))}
    </div>
  );
}

export function Rail({
  current,
  topic,
  topics,
  listHref,
  queue,
  starts,
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
            { href: listHref, label: bank("all"), active: false },
          ]}
        />
        <RailSelect
          label={bank("topic")}
          value={topic}
          onChange={(e) => {
            const next = e.target.value;
            rememberIntent({ via: "picker", placement: "topic_select" });
            starts.then((all) => all[next] && router.push(all[next]));
          }}
        >
          {topics.map((x) => (
            <NativeSelectOption key={x.id} value={x.id}>
              {x.name}
            </NativeSelectOption>
          ))}
        </RailSelect>
      </div>
      <Suspense fallback={<QueueSkeleton />}>
        <QueueList
          key={current}
          queue={queue}
          current={current}
          topic={topic}
          href={href}
        />
      </Suspense>
    </RailContent>
  );
}
