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
  publish: (meta: Meta, queue: Promise<Queue>) => void;
}

const QueueContext = createContext<QueueStore | null>(null);

const published = new WeakSet<Promise<Queue>>();

export function QueueProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<Meta>();
  const [loaded, setLoaded] = useState<Loaded>();
  const latest = useRef<{ topic: string; queue: Promise<Queue> }>(undefined);

  const publish = useCallback((next: Meta, queue: Promise<Queue>) => {
    const stale = published.has(queue) && latest.current?.topic === next.topic;
    if (stale) return;
    published.add(queue);
    latest.current = { topic: next.topic, queue };
    startTransition(() => setMeta(next));
    queue.then((data) => {
      if (latest.current?.queue === queue)
        startTransition(() => setLoaded({ topic: next.topic, queue: data }));
    }, noop);
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
  const { publish } = useQueue();

  useEffect(() => {
    publish({ topic, topics, listHref, starts }, queue);
  }, [publish, topic, topics, listHref, starts, queue]);

  return null;
}
