import { facultyExams, openExamIds } from "@/features/catalog/exams";
import { Shell } from "../../_components/shell/shell";

export default async function FacultyLayout({
  children,
  params,
}: LayoutProps<"/[locale]/[faculty]">) {
  const { faculty } = await params;
  const exam = facultyExams(faculty).find((e) => openExamIds.includes(e.id));

  return (
    <Shell exam={exam?.id} languages={false}>
      {children}
    </Shell>
  );
}
