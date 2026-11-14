import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { getPathname, redirect } = createNavigation(routing);
export {
  ExamBase,
  examHref,
  Link,
  useExamPath,
  usePathname,
  useRouter,
} from "./exam";
