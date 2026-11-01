"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LinkTabs } from "@/components/link-tabs";
import { RailContent, RailSelect, type RailVariant } from "@/components/rail";
import { NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { listed } from "@/features/bank/queue/arrange";
import { useRouter } from "@/i18n/navigation";
import { rememberIntent } from "@/lib/analytics-browser";
import { QueueList } from "./queue-list";
import { useQueue } from "./queue-store";

const href = (id: string) => `/bank/${id}`;

function HeadSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <Skeleton className="h-10 rounded-xl" />
      <Skeleton className="h-15 rounded-lg" />
    </div>
  );
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

export function Rail({ variant }: { variant?: RailVariant }) {
  const bank = useTranslations("Bank");
  const router = useRouter();
  const { id: current } = useParams<{ id?: string }>();
  const { meta, loaded } = useQueue();

  if (!current) return null;

  if (!meta)
    return (
      <RailContent variant={variant}>
        <HeadSkeleton />
        <QueueSkeleton />
      </RailContent>
    );

  return (
    <RailContent variant={variant}>
      <div className="flex flex-col gap-4 px-4 pb-4">
        <LinkTabs
          label={bank("title")}
          variant="fill"
          items={[
            { href: href(current), label: bank("recommended"), active: true },
            { href: meta.listHref, label: bank("all"), active: false },
          ]}
        />
        <RailSelect
          label={bank("topic")}
          value={meta.topic}
          onChange={(e) => {
            const next = e.target.value;
            rememberIntent({ via: "picker", placement: "topic_select" });
            meta.starts.then((all) => all[next] && router.push(all[next]));
          }}
        >
          {meta.topics.map((x) => (
            <NativeSelectOption key={x.id} value={x.id}>
              {x.name}
            </NativeSelectOption>
          ))}
        </RailSelect>
      </div>
      {loaded?.topic === meta.topic && listed(loaded.queue, current) ? (
        <QueueList
          queue={loaded.queue}
          current={current}
          topic={loaded.topic}
          href={href}
        />
      ) : (
        <QueueSkeleton />
      )}
    </RailContent>
  );
}
