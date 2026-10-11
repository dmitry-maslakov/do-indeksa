import { useRouter } from "@/i18n/navigation";
import { useExamStore } from "@/lib/exam-store";

export function useSignedOut() {
  const router = useRouter();

  return () => {
    useExamStore.setState({ runs: {} });
    router.refresh();
  };
}
