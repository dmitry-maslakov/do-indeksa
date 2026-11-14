"use client";

import { useEffect } from "react";
import { rememberExam } from "@/lib/cookies";

export function RememberExam({ id }: { id: string }) {
  useEffect(() => rememberExam(id), [id]);
  return null;
}
