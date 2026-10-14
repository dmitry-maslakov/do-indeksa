import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { SignInButton } from "./sign-in-button";

export function SignInCard({ text }: { text: string }) {
  const t = useTranslations("UserMenu");

  return (
    <Card className="max-w-xl items-start gap-4">
      <p className="text-subtle">{text}</p>
      <SignInButton>{t("signIn")}</SignInButton>
    </Card>
  );
}
