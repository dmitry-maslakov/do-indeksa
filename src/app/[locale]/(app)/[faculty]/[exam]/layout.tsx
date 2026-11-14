import { notFound } from "next/navigation";
import { examByParams, examOf, openExamParams } from "@/features/catalog/exams";
import { ExamBase } from "@/i18n/navigation";
import { RememberExam } from "./_components/remember-exam";

export function generateStaticParams() {
  return openExamParams;
}

export default async function OpenExamLayout({
  children,
  params,
}: LayoutProps<"/[locale]/[faculty]/[exam]">) {
  const id = examByParams(await params);
  if (!id) notFound();
  return (
    <ExamBase path={examOf(id).path}>
      <RememberExam id={id} />
      {children}
    </ExamBase>
  );
}
