import { Shell } from "../_components/shell/shell";

export default function ExamLayout({ children }: LayoutProps<"/[locale]">) {
  return <Shell mode="exam">{children}</Shell>;
}
