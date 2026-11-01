"use client";

import { noop } from "es-toolkit";
import { useParams } from "next/navigation";
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
import { arrange, progressOf } from "@/features/bank/queue/arrange";
import type { Queue } from "@/features/bank/queue/queue";
import { recommendationOf } from "@/features/bank/queue/recommendation";
import {
  type NextTask,
  NextTaskContext,
} from "@/features/practice/answer/action-bar";

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
    if (published.has(queue) && latest.current?.topic === next.topic) return;
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

export function useVisitProgress() {
  const { id } = useParams<{ id?: string }>();
  const { meta, loaded } = useQueue();
  if (!id || !meta || loaded?.topic !== meta.topic) return undefined;
  return progressOf(arrange(loaded.queue, id), id);
}

function useNextTask(id: string): NextTask | undefined {
  const { meta, loaded } = useQueue();
  if (!meta || loaded?.topic !== meta.topic) return undefined;
  const [next] = arrange(loaded.queue, id).upcoming;
  return {
    href: next && `/bank/${next.id}`,
    recommendation: recommendationOf("next", meta.topic, next),
  };
}

export function LiveNextTask({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const next = useNextTask(id);
  return <NextTaskContext value={next}>{children}</NextTaskContext>;
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
