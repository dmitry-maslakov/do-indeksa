import { useTranslations } from "next-intl";
import { SignInButton } from "@/components/sign-in-button";
import { Card, CardTitle } from "@/components/ui/card";

export function AccountNote() {
  const t = useTranslations("Account");

  return (
    <Card className="items-start gap-3">
      <CardTitle>{t("title")}</CardTitle>
      <p className="text-sm text-subtle">{t("text")}</p>
      <p className="text-[13px] text-subtle">{t("stores")}</p>
      <SignInButton size="sm" variant="tint">
        {t("signIn")}
      </SignInButton>
    </Card>
  );
}
