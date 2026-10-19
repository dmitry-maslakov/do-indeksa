"use client";

import { cn } from "cn";
import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimisticAction } from "next-safe-action/hooks";
import { type ComponentProps, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/features/account/sign-in-button";
import { useErrorText } from "@/lib/use-error-text";
import { setFavorite } from "./favorite-action";

interface FavoriteButtonProps {
  taskId: string;
  saved?: boolean;
  signedIn?: boolean;
  pending?: boolean;
  compact?: boolean;
}

export function FavoriteButton({
  taskId,
  saved: initial = false,
  signedIn = false,
  pending = false,
  compact = false,
}: FavoriteButtonProps) {
  const t = useTranslations("Solve");
  const errorText = useErrorText();
  const [saved, setSaved] = useState(initial);
  const { execute, optimisticState: shown } = useOptimisticAction(setFavorite, {
    currentState: saved,
    updateFn: (_, { favorite }) => favorite,
    onSuccess: ({ data }) => setSaved(data),
    onError: ({ error }) => toast.error(errorText(error.serverError)),
  });
  const toggle = () => execute({ taskId, favorite: !shown });

  const label = shown ? t("saved") : t("save");
  const props = {
    variant: "ghost",
    size: "sm",
    disabled: pending,
    "aria-label": label,
    className: cn(
      "bg-transparent",
      compact
        ? "size-9 shrink-0 rounded-xl px-0 hover:bg-muted"
        : "-mr-2 px-2 sm:px-4",
    ),
  } satisfies ComponentProps<typeof Button>;
  const star = (
    <>
      <StarIcon
        className={cn(
          compact ? "size-4 text-foreground" : "text-subtle",
          shown && "fill-overtime text-overtime",
        )}
      />
      {!compact && <span className="hidden sm:inline">{label}</span>}
    </>
  );

  if (!signedIn) return <SignInButton {...props}>{star}</SignInButton>;

  return (
    <Button {...props} onClick={toggle} aria-pressed={shown}>
      {star}
    </Button>
  );
}
