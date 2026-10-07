import { useTranslations } from "next-intl";
import { SignInButton } from "@/components/sign-in-button";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

interface EmptyNoteProps {
  text: string;
  signedIn: boolean;
  href?: string;
  action?: string;
}

export function EmptyNote({ text, signedIn, href, action }: EmptyNoteProps) {
  const t = useTranslations("UserMenu");

  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl bg-muted px-5 py-4 text-sm text-subtle">
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
  );
}
