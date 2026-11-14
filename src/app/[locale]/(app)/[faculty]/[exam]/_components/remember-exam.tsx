"use client";

import { useEffect } from "react";
import { examCookie, writeCookie } from "@/lib/cookies";
import { daySeconds } from "@/lib/dates";

const maxAge = 365 * daySeconds;

export function RememberExam({ id }: { id: string }) {
  useEffect(() => writeCookie(examCookie, id, maxAge), [id]);
  return null;
}
