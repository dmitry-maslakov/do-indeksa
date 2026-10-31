"use client";

import { noop } from "es-toolkit";
import { useParams } from "next/navigation";
import {
  createContext,
  type ReactNode,
  use,
  useOptimistic,
  useState,
} from "react";

type Pair<T> = [T, (value: T) => void];

const State = createContext<{
  topic: Pair<string | null>;
  sheet: Pair<boolean>;
}>({ topic: [null, noop], sheet: [false, noop] });

export function BankState({ children }: { children: ReactNode }) {
  const params = useParams<{ topic?: string }>();
  const topic = useOptimistic(params.topic ?? null);
  const sheet = useState(false);
  return <State value={{ topic, sheet }}>{children}</State>;
}

export const useBankState = () => use(State);
