import { notFound } from "next/navigation";
import { examByPath, openExamParams } from "@/features/catalog/exams";
import { ExamBase } from "@/i18n/navigation";

export function generateStaticParams() {
  return openExamParams;
}

export default async function OpenExamLayout({
  children,
  params,
}: LayoutProps<"/[locale]/[faculty]/[exam]">) {
  const { faculty, exam } = await params;
  const path = `/${faculty}/${exam}`;
  if (!examByPath(path)) notFound();
  return <ExamBase path={path}>{children}</ExamBase>;
}
