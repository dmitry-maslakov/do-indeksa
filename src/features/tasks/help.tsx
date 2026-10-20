"use client";

import { createContext, type ReactNode, use, useState } from "react";

interface Help {
  hints: number;
  solution: boolean;
  showHint: () => void;
  showSolution: () => void;
}

const HelpContext = createContext<Help>({
  hints: 0,
  solution: false,
  showHint: () => {},
  showSolution: () => {},
});

export function HelpProvider({ children }: { children: ReactNode }) {
  const [hints, setHints] = useState(0);
  const [solution, setSolution] = useState(false);
  return (
    <HelpContext
      value={{
        hints,
        solution,
        showHint: () => setHints((n) => n + 1),
        showSolution: () => setSolution(true),
      }}
    >
      {children}
    </HelpContext>
  );
}

export const useHelp = () => use(HelpContext);
