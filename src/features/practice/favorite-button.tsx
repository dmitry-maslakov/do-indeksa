"use client";

import { cn } from "cn";
import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimisticAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useErrorText } from "@/lib/use-error-text";
import { setFavorite } from "./favorite-action";

interface FavoriteButtonProps {
  taskId: string;
  saved?: boolean;
  pending?: boolean;
}

export function FavoriteButton({
  taskId,
  saved: initial = false,
  pending = false,
}: FavoriteButtonProps) {
  const t = useTranslations("Solve");
  const errorText = useErrorText();
  const [saved, setSaved] = useState(initial);
  const { execute, optimisticState: shown } = useOptimisticAction(setFavorite, {
    currentState: saved,
    updateFn: (_, { favorite }) => favorite,
    onSuccess: ({ data }) => setSaved(data),
    onError: () => toast.error(errorText()),
  });
  const toggle = () => execute({ taskId, favorite: !shown });

  const label = shown ? t("saved") : t("save");

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={label}
      aria-pressed={shown}
      onClick={toggle}
      className="size-9 shrink-0 rounded-xl bg-transparent px-0 hover:bg-muted"
    >
      <StarIcon
        className={cn(
          "size-4 text-foreground",
          shown && "fill-overtime text-overtime",
        )}
      />
    </Button>
  );
}
