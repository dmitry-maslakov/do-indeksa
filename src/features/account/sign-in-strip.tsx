"use client";

import { cn } from "cn";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, use, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { queueEvent } from "@/lib/analytics-browser";
import { GoogleLogo } from "./google-logo";
import { nudgeAfterSolved } from "./nudge";
import { GoogleSignInButton } from "./sign-in-button";

const taskStripShown = "sign-in-strip-task";

function Screen({ className, sync }: { className: string; sync?: boolean }) {
  return (
    <span
      className={cn(
        "absolute flex flex-col justify-center rounded-[5px] border-2 border-foreground bg-card",
        className,
      )}
    >
      <span className="h-0.75 rounded-xs bg-untouched">
        <span
          className={cn(
            "block h-full w-[62%] rounded-xs bg-data",
            sync && "animate-sync motion-reduce:animate-none",
          )}
        />
      </span>
    </span>
  );
}

function DevicesIcon() {
  return (
    <span aria-hidden="true" className="relative h-11 w-16 shrink-0">
      <Screen className="top-0.5 left-0 h-7.5 w-11.5 px-1.5" />
      <span className="absolute top-8.25 -left-0.5 h-1 w-12.5 rounded-xs bg-foreground" />
      <Screen className="top-2.75 left-10.5 h-8 w-5 px-0.75" sync />
    </span>
  );
}

interface SignInStripProps {
  from: "result" | "task";
  solved?: number;
  children: ReactNode;
}

export function SignInStrip({ from, solved, children }: SignInStripProps) {
  const t = useTranslations("SignInStrip");
  const { bfcacheId } = useRouter();
  const [open, setOpen] = useState(true);
  const shownOn = useRef<string>(undefined);
  useEffect(() => {
    if (!open || shownOn.current === bfcacheId) return;
    shownOn.current = bfcacheId;
    queueEvent("sign_in_prompt_shown", { from, solved });
  }, [open, bfcacheId, from, solved]);
  if (!open) return null;

  return (
    <section
      aria-label={t("label")}
      className="flex max-w-full animate-in flex-wrap items-center gap-x-4 gap-y-3 self-start rounded-[18px] bg-muted py-2.5 pr-2 pl-4 fade-in slide-in-from-bottom-2.5 delay-400 duration-500 ease-[cubic-bezier(.2,.8,.2,1)] fill-mode-both motion-reduce:animate-none"
    >
      <DevicesIcon />
      <p className="flex-[1_1_10rem] font-medium text-[15px] leading-[1.4] md:flex-[0_1_auto]">
        {children}
      </p>
      <span className="flex items-center gap-1">
        <GoogleSignInButton
          from={from}
          variant="google"
          className="h-10 gap-2 rounded-[11px] px-4 text-sm"
        >
          <GoogleLogo />
          {t("save")}
        </GoogleSignInButton>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("close")}
          onClick={() => {
            setOpen(false);
            queueEvent("sign_in_prompt_closed", { from });
          }}
        >
          <XIcon className="text-subtle" />
        </Button>
      </span>
    </section>
  );
}

export function TaskSignInStrip({
  solved: count,
}: {
  solved: Promise<number | undefined>;
}) {
  const t = useTranslations("SignInStrip");
  const solved = use(count) ?? 0;
  const [show] = useState(
    () => solved >= nudgeAfterSolved && !sessionStorage.getItem(taskStripShown),
  );
  useEffect(() => {
    if (show) sessionStorage.setItem(taskStripShown, "1");
  }, [show]);
  return (
    show && (
      <SignInStrip from="task" solved={solved}>
        {t("task", { count: solved })}
      </SignInStrip>
    )
  );
}
