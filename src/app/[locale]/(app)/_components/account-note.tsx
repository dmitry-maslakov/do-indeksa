import { useTranslations } from "next-intl";
import { Card, CardTitle } from "@/components/ui/card";
import {
  GoogleSignInButton,
  PrivacyLink,
} from "@/features/account/sign-in-button";

export function AccountNote() {
  const t = useTranslations("Account");

  return (
    <Card className="items-start gap-3">
      <CardTitle>{t("title")}</CardTitle>
      <p className="text-sm text-subtle">{t("text")}</p>
      <p className="text-[13px] text-subtle">{t("stores")}</p>
      <PrivacyLink />
      <GoogleSignInButton size="sm" variant="tint">
        {t("signIn")}
      </GoogleSignInButton>
    </Card>
  );
}
