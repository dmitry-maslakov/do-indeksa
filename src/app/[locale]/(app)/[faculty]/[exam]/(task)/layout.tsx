import { Shell } from "@/app/[locale]/(app)/_components/shell/shell";
import { examAt } from "@/features/catalog/exams";

export default async function TaskLayout({
  children,
  params,
}: LayoutProps<"/[locale]/[faculty]/[exam]">) {
  return (
    <Shell mode="task" exam={examAt(await params)}>
      {children}
    </Shell>
  );
}
