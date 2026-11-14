import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useVisitProgress } from "./queue-store";

const tags = {
  ok: (chunks: ReactNode) => (
    <span className="text-success-text">{chunks}</span>
  ),
};

export function VisitPosition() {
  const t = useTranslations("Solve");
  const progress = useVisitProgress();
  if (!progress) return null;
  return t.rich("visitPosition", {
    position: progress.position,
    right: progress.right,
    ...tags,
  });
}
