"use client";

import { LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { SignInButton } from "@/components/sign-in-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

export function UserMenu() {
  const t = useTranslations("UserMenu");
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  if (isPending) return <span className="size-9 rounded-full bg-data-tint" />;

  if (!data) {
    return <SignInButton size="sm">{t("signIn")}</SignInButton>;
  }

  const { user } = data;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full" aria-label={t("account")}>
        <Avatar className="size-9">
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback className="bg-data-tint text-data">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-foreground">{user.name}</span>
          <span className="font-normal text-subtle text-xs">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            authClient.signOut({
              fetchOptions: { onSuccess: () => router.refresh() },
            })
          }
        >
          <LogOutIcon />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
