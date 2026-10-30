"use client";

import { useEffect } from "react";
import { recordError } from "@/lib/analytics-browser";

export function NotFoundShown() {
  useEffect(() => recordError("not_found"), []);
  return null;
}
