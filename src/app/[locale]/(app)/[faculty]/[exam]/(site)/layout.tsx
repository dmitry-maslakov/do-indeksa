import { Shell } from "@/app/[locale]/(app)/_components/shell/shell";
import { examAt } from "@/features/catalog/exams";

export default async function SiteLayout({
  children,
  params,
}: LayoutProps<"/[locale]/[faculty]/[exam]">) {
  return <Shell exam={examAt(await params)}>{children}</Shell>;
}
