"use client";

import { cn } from "cn";
import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { isFavorite, setFavorite } from "@/server/favorites";

export function FavoriteButton({ taskId }: { taskId: string }) {
  const t = useTranslations("Solve");
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [saved, setSaved] = useState(false);
  const [shown, setShown] = useOptimistic(saved);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (session) isFavorite(taskId).then(setSaved);
  }, [session, taskId]);

  function toggle() {
    if (!session) {
      authClient.signIn.social({ provider: "google", callbackURL: pathname });
      return;
    }
    startTransition(async () => {
      setShown(!saved);
      setSaved(await setFavorite(taskId, !saved));
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-pressed={shown}
      className="bg-transparent"
    >
      <StarIcon
        className={cn("text-subtle", shown && "fill-overtime text-overtime")}
      />
      {shown ? t("saved") : t("save")}
    </Button>
  );
}
