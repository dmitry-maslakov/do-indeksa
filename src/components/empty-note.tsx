import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { SignInButton } from "@/components/sign-in-button";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

interface EmptyNoteProps {
  ghost: ReactNode;
  text: string;
  signedIn: boolean;
  href?: string;
  action?: string;
}

export function EmptyNote({
  ghost,
  text,
  signedIn,
  href,
  action,
}: EmptyNoteProps) {
  const t = useTranslations("UserMenu");

  return (
    <div className="flex flex-col gap-4">
      <div className="mask-b-from-30% **:data-[slot=skeleton]:animate-none **:data-[slot=skeleton]:bg-none">
        {ghost}
      </div>
      <div className="flex flex-col items-start gap-3 text-sm text-subtle">
        <p>{text}</p>
        {signedIn ? (
          href && (
            <Button
              size="sm"
              variant="tint"
              render={<Link href={href} />}
              nativeButton={false}
            >
              {action}
            </Button>
          )
        ) : (
          <SignInButton size="sm" variant="tint">
            {t("signIn")}
          </SignInButton>
        )}
      </div>
    </div>
  );
}
