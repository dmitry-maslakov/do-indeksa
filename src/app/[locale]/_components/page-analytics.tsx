"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useEffect } from "react";
import { reportVital, viewPage } from "@/lib/analytics-browser";

export function PageAnalytics() {
  const pathname = usePathname();
  useReportWebVitals(reportVital);
  useEffect(() => viewPage(pathname), [pathname]);
  return null;
}
