"use client";

import { use, useEffect, useEffectEvent } from "react";
import type { SittingState } from "@/features/progress/learning/sitting-state";
import { useTaskSession } from "./task-session";

export function SittingFeed({ sitting }: { sitting: Promise<SittingState> }) {
  const { restore } = useTaskSession();
  const state = use(sitting);
  const apply = useEffectEvent(restore);

  useEffect(() => apply(state), [state]);

  return null;
}
