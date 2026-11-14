import { notFound } from "next/navigation";
import { examByPath, openExamParams } from "@/features/catalog/exams";
import { ExamBase } from "@/i18n/navigation";
import { RememberExam } from "./_components/remember-exam";

export function generateStaticParams() {
  return openExamParams;
}

export default async function OpenExamLayout({
  children,
  params,
}: LayoutProps<"/[locale]/[faculty]/[exam]">) {
  const { faculty, exam } = await params;
  const path = `/${faculty}/${exam}`;
  const id = examByPath(path);
  if (!id) notFound();
  return (
    <ExamBase path={path}>
      <RememberExam id={id} />
      {children}
    </ExamBase>
  );
}
