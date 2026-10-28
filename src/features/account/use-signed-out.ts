import { useTestStore } from "@/features/tests/runner/test-store";
import { useRouter } from "@/i18n/navigation";

export function useSignedOut() {
  const router = useRouter();

  return () => {
    useTestStore.setState({ tests: {} });
    router.refresh();
  };
}
