"use client";

import { FlagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStateAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/features/account/auth-client";
import { SignInButton } from "@/features/account/sign-in-button";
import { reportTask } from "./report-action";
import { reportKinds } from "./report-kinds";

export function ReportTask({ taskId }: { taskId: string }) {
  const t = useTranslations("Report");
  const user = useTranslations("UserMenu");
  const { data: session } = authClient.useSession();
  const { formAction, isPending, hasSucceeded, hasErrored } =
    useStateAction(reportTask);

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
      ) : hasSucceeded ? (
        <p role="status" className="mt-3 text-sm text-success-text">
          {t("thanks")}
        </p>
      ) : (
        <form action={formAction} className="mt-3 flex flex-col gap-3">
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
          {hasErrored && (
            <p role="alert" className="text-sm text-error-text">
              {t("error")}
            </p>
          )}
          <Button
            type="submit"
            variant="secondary"
            disabled={isPending}
            className="self-start"
          >
            {t("send")}
          </Button>
        </form>
      )}
    </details>
  );
}
