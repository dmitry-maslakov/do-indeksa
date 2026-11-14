import { Shell } from "@/app/[locale]/(app)/_components/shell/shell";
import { examAt } from "@/features/catalog/exams";

export default async function ExamLayout({
  children,
  params,
}: LayoutProps<"/[locale]/[faculty]/[exam]">) {
  return (
    <Shell mode="exam" exam={examAt(await params)}>
      {children}
    </Shell>
  );
}
