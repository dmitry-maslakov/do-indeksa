"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useState,
} from "react";

interface Hints {
  used: number;
  open: (part: number) => void;
}

const HintsContext = createContext<Hints | null>(null);

export function HintsProvider({ children }: { children: ReactNode }) {
  const [opened, setOpened] = useState<number[]>([]);
  const open = useCallback(
    (part: number) => setOpened((o) => (o.includes(part) ? o : [...o, part])),
    [],
  );
  return (
    <HintsContext value={{ used: opened.length, open }}>
      {children}
    </HintsContext>
  );
}

export const useHints = () => use(HintsContext);
