import { useLocale } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { composeVariant } from "@/features/variants/actions";
import { navigationStarted } from "@/lib/analytics-browser";
import { useErrorText } from "@/lib/use-error-text";
import type { ComposeMode } from "./compose";

export function useComposeVariant() {
  const locale = useLocale();
  const errorText = useErrorText();
  const { execute } = useAction(composeVariant, {
    onError: () => toast.error(errorText()),
  });
  return (input: { mode: ComposeMode; topics: string[]; count?: number }) => {
    navigationStarted("push");
    execute({ ...input, locale });
  };
}
