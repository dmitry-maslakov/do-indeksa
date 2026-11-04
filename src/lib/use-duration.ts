import { useTranslations } from "next-intl";
import { toMinutes } from "./dates";

export function useDuration() {
  const t = useTranslations("Time");
  return (ms: number) => {
    const minutes = toMinutes(ms);
    return t("duration", {
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
    });
  };
}
