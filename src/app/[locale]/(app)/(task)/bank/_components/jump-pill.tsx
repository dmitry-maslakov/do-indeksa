import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type RefObject, useEffect, useState } from "react";
import { observe } from "react-intersection-observer";

interface JumpPillProps {
  list: RefObject<HTMLElement | null>;
  current: string;
  onJump: () => void;
}

export function JumpPill({ list, current, onJump }: JumpPillProps) {
  const t = useTranslations("Solve");
  const [side, setSide] = useState<"above" | "below">();

  useEffect(() => {
    const root = list.current;
    const row = root?.querySelector(`[data-id="${current}"]`);
    if (!root || !row) return;
    return observe(
      row,
      (inView, { boundingClientRect, rootBounds }) =>
        setSide(
          inView
            ? undefined
            : boundingClientRect.top < (rootBounds?.top ?? 0)
              ? "above"
              : "below",
        ),
      { root, threshold: 0.5 },
    );
  }, [list, current]);

  if (!side) return null;
  const Arrow = side === "above" ? ArrowUpIcon : ArrowDownIcon;
  return (
    <button
      type="button"
      onClick={onJump}
      data-side={side}
      className="fade-in absolute left-1/2 z-3 flex h-7.5 -translate-x-1/2 animate-in items-center motion-reduce:animate-none gap-1.5 whitespace-nowrap rounded-full border bg-card pr-3 pl-2.5 font-medium text-xs shadow-raised data-[side=above]:top-10 data-[side=below]:bottom-3"
    >
      <Arrow aria-hidden className="size-3.5" />
      {t("current")}
    </button>
  );
}
