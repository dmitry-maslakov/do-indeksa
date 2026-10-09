"use client";

import { FlagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { SignInButton } from "@/components/sign-in-button";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { reportKinds } from "@/lib/report";
import { reportTask } from "@/server/reports";

export function ReportTask({ taskId }: { taskId: string }) {
  const t = useTranslations("Report");
  const user = useTranslations("UserMenu");
  const { data: session } = authClient.useSession();
  const [state, action, pending] = useActionState(reportTask, "idle");

  return (
    <details>
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-subtle hover:text-foreground [&::-webkit-details-marker]:hidden">
        <FlagIcon className="size-4" />
        {t("open")}
      </summary>
      {!session ? (
        <div className="mt-3 flex flex-col items-start gap-3 text-sm text-subtle">
          <p>{t("guest")}</p>
          <SignInButton size="sm" variant="tint">
            {user("signIn")}
          </SignInButton>
        </div>
      ) : state === "sent" ? (
        <p role="status" className="mt-3 text-sm text-success-text">
          {t("thanks")}
        </p>
      ) : (
        <form action={action} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="taskId" value={taskId} />
          <NativeSelect name="kind" aria-label={t("kind")} className="w-full">
            {reportKinds.map((kind) => (
              <NativeSelectOption key={kind} value={kind}>
                {t(kind)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Textarea
            name="message"
            maxLength={1000}
            aria-label={t("message")}
            placeholder={t("message")}
          />
          {state === "error" && (
            <p role="alert" className="text-sm text-error-text">
              {t("error")}
            </p>
          )}
          <Button
            type="submit"
            variant="secondary"
            disabled={pending}
            className="self-start"
          >
            {t("send")}
          </Button>
        </form>
      )}
    </details>
  );
}
