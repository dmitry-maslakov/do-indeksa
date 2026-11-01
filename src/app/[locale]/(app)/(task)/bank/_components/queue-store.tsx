"use client";

import { noop } from "es-toolkit";
import {
  createContext,
  type ReactNode,
  startTransition,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Queue } from "@/features/bank/queue/queue";
import { useRouter } from "@/i18n/navigation";

interface Meta {
  topic: string;
  topics: { id: string; name: string }[];
  listHref: string;
  starts: Promise<Record<string, string>>;
}

interface Loaded {
  topic: string;
  queue: Queue;
}

interface QueueStore {
  meta?: Meta;
  loaded?: Loaded;
  publish: (meta: Meta, queue: Promise<Queue>) => boolean;
}

const QueueContext = createContext<QueueStore | null>(null);

const published = new WeakSet<Promise<Queue>>();

export function QueueProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<Meta>();
  const [loaded, setLoaded] = useState<Loaded>();
  const latest = useRef<{ topic: string; queue: Promise<Queue> }>(undefined);

  const publish = useCallback((next: Meta, queue: Promise<Queue>) => {
    const shown = published.has(queue);
    if (shown && latest.current?.topic === next.topic) return false;
    published.add(queue);
    latest.current = { topic: next.topic, queue };
    startTransition(() => setMeta(next));
    queue.then((data) => {
      if (latest.current?.queue === queue)
        startTransition(() => setLoaded({ topic: next.topic, queue: data }));
    }, noop);
    return !shown;
  }, []);

  return (
    <QueueContext value={{ meta, loaded, publish }}>{children}</QueueContext>
  );
}

export function useQueue() {
  const store = use(QueueContext);
  if (!store) throw new Error("useQueue needs a QueueProvider");
  return store;
}

export function QueueFeed({
  topic,
  topics,
  listHref,
  starts,
  queue,
}: Meta & { queue: Promise<Queue> }) {
  const router = useRouter();
  const { publish } = useQueue();

  useEffect(() => {
    if (!publish({ topic, topics, listHref, starts }, queue)) router.refresh();
  }, [publish, router, topic, topics, listHref, starts, queue]);

  return null;
}
