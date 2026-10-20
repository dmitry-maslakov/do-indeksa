import { useExamStore } from "@/features/exam/exam-store";
import { useRouter } from "@/i18n/navigation";

export function useSignedOut() {
  const router = useRouter();

  return () => {
    useExamStore.setState({ tests: {} });
    router.refresh();
  };
}
